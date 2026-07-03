import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTierFeatures } from "@/lib/tier";
import { addDays } from "date-fns";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as any).businessId;

  const lead = await prisma.lead.findFirst({ where: { id: params.id, businessId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const features = getTierFeatures(business.tier);
  if (!features.followUpAutomation) return NextResponse.json({ error: "Upgrade to Growth or Pro to use Follow-Up Sequences" }, { status: 403 });

  // Remove any existing sequences
  await prisma.followUpSequence.deleteMany({ where: { leadId: lead.id } });

  const now = new Date();
  const sequences = [
    { day: 1, channel: "whatsapp", templateText: `Hi ${lead.name.split(' ')[0]}, this is ${business.name}. We noticed you reached out about ${lead.concernType}. Would you like to book an appointment? Reply YES and we'll call you!` },
    { day: 3, channel: "email", templateText: `Dear ${lead.name.split(' ')[0]}, We'd love to help you with ${lead.concernType}. Book your visit at ${business.name} today.` },
    { day: 7, channel: "whatsapp", templateText: `Hi ${lead.name.split(' ')[0]}, just a friendly reminder from ${business.name}. We're here whenever you're ready. Call us at ${business.phone}.` },
  ];

  const created = await Promise.all(
    sequences.map(s =>
      prisma.followUpSequence.create({
        data: {
          leadId: lead.id,
          day: s.day,
          channel: s.channel,
          templateText: s.templateText,
          status: "pending",
          scheduledFor: addDays(now, s.day),
        },
      })
    )
  );

  return NextResponse.json({ sequences: created }, { status: 201 });
}
