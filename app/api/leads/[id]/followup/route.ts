import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { getTierFeatures } from "@/lib/tier";
import { addDays } from "date-fns";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const businessId = business.id;

  const lead = await prisma.lead.findFirst({ where: { id: params.id, businessId } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
