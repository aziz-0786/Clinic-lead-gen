import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/business";
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
  const current = await getCurrentBusiness();
  if (!current) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const business = await prisma.business.findUnique({
    where: { id: current.id },
    select: { id: true, slug: true, name: true, ownerName: true, email: true, city: true, phone: true, whatsappNumber: true, alertEmail: true, specialty: true, tier: true, brandColor: true, avgPatientValue: true, avgInquiryToBookingRate: true },
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ business });
}

export async function PATCH(req: Request) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const businessId = business.id;

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.business.update({ where: { id: businessId }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
