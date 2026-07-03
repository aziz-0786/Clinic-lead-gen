import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/business";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const businessId = business.id;

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, businessId },
    include: { followUpSequences: { orderBy: { day: "asc" } }, alertLogs: { orderBy: { sentAt: "desc" } } },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const businessId = business.id;

  const body = await req.json();
  const allowed = ["status", "notes", "appointmentTime", "lastContactedAt"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] === "" ? null : body[key];
  }

  const lead = await prisma.lead.updateMany({ where: { id: params.id, businessId }, data: update });
  if (lead.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
