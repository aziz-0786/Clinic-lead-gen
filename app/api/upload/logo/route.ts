import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Stores logo as base64 data URI in the logoUrl field.
// In production, swap this for S3/Cloudinary upload.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as any).businessId;

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
