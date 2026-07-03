import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  alertEmail: z.string().email().optional(),
  specialty: z.string().optional(),
  brandColor: z.string().optional(),
  avgPatientValue: z.number().optional(),
  avgInquiryToBookingRate: z.number().optional(),
});

export async function GET(_req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as any).businessId;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, slug: true, name: true, ownerName: true, email: true, city: true, phone: true, whatsappNumber: true, alertEmail: true, specialty: true, tier: true, brandColor: true, avgPatientValue: true, avgInquiryToBookingRate: true },
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ business });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as any).businessId;

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.business.update({ where: { id: businessId }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
