import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildHighIntentEmailHtml } from "@/lib/email";
import { sendWhatsAppAlert, buildHighIntentWhatsAppMessage } from "@/lib/whatsapp";
import { getTierFeatures } from "@/lib/tier";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const businessId = business.id;

  const { channel } = await req.json();
  const lead = await prisma.lead.findFirst({ where: { id: params.id, businessId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const features = getTierFeatures(business.tier);
  let ok = false;

  if (channel === "email") {
    if (!features.emailAlertsHighIntent) return NextResponse.json({ error: "Upgrade to Growth to send email alerts" }, { status: 403 });
    const html = buildHighIntentEmailHtml({
      clinicName: business.name, patientName: lead.name, patientPhone: lead.phone, patientEmail: lead.email ?? null,
      concernType: lead.concernType, urgency: lead.urgency, intentLabel: lead.intentLabel, intentScore: lead.intentScore,
      leadUrl: `${process.env.APP_URL}/dashboard/leads/${lead.id}`,
    });
    const res = await sendEmail({ to: business.alertEmail, subject: `[MANUAL] Alert for ${lead.name}`, html });
    ok = res.ok;
  } else if (channel === "whatsapp") {
    if (!features.whatsappAlertsHighIntent) return NextResponse.json({ error: "Upgrade to Pro to send WhatsApp alerts" }, { status: 403 });
    const message = buildHighIntentWhatsAppMessage({ clinicName: business.name, patientName: lead.name, patientPhone: lead.phone, concernType: lead.concernType, urgency: lead.urgency, intentLabel: lead.intentLabel });
    const res = await sendWhatsAppAlert({ to: business.whatsappNumber, message });
    ok = res.ok;
  } else {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  await prisma.alertLog.create({
    data: { leadId: lead.id, businessId, channel, status: ok ? "sent" : "failed", payload: JSON.stringify({ manual: true }) },
  });
  await prisma.lead.update({ where: { id: lead.id }, data: { lastContactedAt: new Date() } });

  return NextResponse.json({ ok });
}
