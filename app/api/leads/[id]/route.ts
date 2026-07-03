import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as any).businessId;

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, businessId },
    include: { followUpSequences: { orderBy: { day: "asc" } }, alertLogs: { orderBy: { sentAt: "desc" } } },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as any).businessId;

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
