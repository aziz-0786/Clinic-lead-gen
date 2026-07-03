import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, ownerName: true, specialty: true, brandColor: true, logoUrl: true, tier: true },
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions = await prisma.chatbotQuestion.findMany({
    where: { businessId: business.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ business, questions });
}
