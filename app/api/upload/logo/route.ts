import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/business";
import { prisma } from "@/lib/prisma";

// Stores logo as base64 data URI in the logoUrl field.
// In production, swap this for S3/Cloudinary upload.
export async function POST(req: Request) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const businessId = business.id;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 2 MB)" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Must be an image" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  await prisma.business.update({ where: { id: businessId }, data: { logoUrl: dataUri } });
  return NextResponse.json({ logoUrl: dataUri });
}
