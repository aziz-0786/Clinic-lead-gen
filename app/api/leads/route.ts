import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { computeIntentScore } from "@/lib/scoring";
import { getTierFeatures } from "@/lib/tier";
import { sendEmail, buildHighIntentEmailHtml } from "@/lib/email";
import { sendWhatsAppAlert, buildHighIntentWhatsAppMessage } from "@/lib/whatsapp";
import { z } from "zod";

const CreateLeadSchema = z.object({
  businessSlug: z.string(),
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  concernType: z.string(),
  urgency: z.enum(["EMERGENCY_TODAY", "THIS_WEEK", "THIS_MONTH", "JUST_EXPLORING"]),
  visitMode: z.string(),
  patientType: z.string(),
  hasInsurance: z.boolean().optional(),
  answers: z.record(z.string()),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateLeadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const business = await prisma.business.findUnique({ where: { slug: data.businessSlug } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { score, label } = computeIntentScore({
    urgency: data.urgency,
    concernMatchesSpecialty: true,
    patientType: data.patientType === "Returning Patient" ? "Returning" : "New",
    hasPhone: !!data.phone,
    hasEmail: !!data.email,
  });

  const lead = await prisma.lead.create({
    data: {
      businessId: business.id,
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      concernType: data.concernType,
      urgency: data.urgency,
      visitMode: data.visitMode,
      patientType: data.patientType,
      hasInsurance: data.hasInsurance,
      answers: JSON.stringify(data.answers),
      intentLabel: label,
      intentScore: score,
      status: "NEW",
      source: "Website Chatbot",
    },
  });

  // Trigger alerts for High or Emergency based on tier
  const features = getTierFeatures(business.tier);
  const isHighPriority = label === "HIGH" || data.urgency === "EMERGENCY_TODAY";

  if (isHighPriority && features.emailAlertsHighIntent) {
    const html = buildHighIntentEmailHtml({
      clinicName: business.name,
      patientName: data.name,
      patientPhone: data.phone,
      patientEmail: data.email || null,
      concernType: data.concernType,
      urgency: data.urgency,
      intentLabel: label,
      intentScore: score,
      leadUrl: `${process.env.APP_URL}/dashboard/leads/${lead.id}`,
    });
    const { ok } = await sendEmail({ to: business.alertEmail, subject: `[${label} INTENT] New Inquiry — ${data.name}`, html });
    await prisma.alertLog.create({
      data: { leadId: lead.id, businessId: business.id, channel: "email", status: ok ? "sent" : "failed", payload: JSON.stringify({ to: business.alertEmail }) },
    });
  }

  if (isHighPriority && features.whatsappAlertsHighIntent) {
    const message = buildHighIntentWhatsAppMessage({
      clinicName: business.name, patientName: data.name, patientPhone: data.phone,
      concernType: data.concernType, urgency: data.urgency, intentLabel: label,
    });
    const { ok } = await sendWhatsAppAlert({ to: business.whatsappNumber, message });
    await prisma.alertLog.create({
      data: { leadId: lead.id, businessId: business.id, channel: "whatsapp", status: ok ? "sent" : "failed", payload: JSON.stringify({ to: business.whatsappNumber }) },
    });
  }

  return NextResponse.json({ lead: { id: lead.id, intentLabel: label, intentScore: score } }, { status: 201 });
}

export async function GET(req: Request) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });

  const businessId = business.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const intent = searchParams.get("intent");
  const urgency = searchParams.get("urgency");
  const search = searchParams.get("search");
  const month = searchParams.get("month"); // YYYY-MM
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = { businessId };
  if (status && status !== "ALL") where.status = status;
  if (intent && intent !== "ALL") where.intentLabel = intent;
  if (urgency && urgency !== "ALL") where.urgency = urgency;
  if (search) where.OR = [
    { name: { contains: search } },
    { phone: { contains: search } },
  ];
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.createdAt = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  } else if (dateFrom || dateTo) {
    const range: Record<string, Date> = {};
    if (dateFrom) range.gte = new Date(dateFrom);
    if (dateTo) { const d = new Date(dateTo); d.setDate(d.getDate() + 1); range.lt = d; }
    where.createdAt = range;
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [
      { urgency: "asc" }, // EMERGENCY_TODAY sorts first alphabetically — handled in UI
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ leads });
}
