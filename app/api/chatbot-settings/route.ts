import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const QuestionSchema = z.object({
  id: z.string().optional(),
  order: z.number(),
  questionText: z.string().min(1),
  type: z.enum(["single_choice", "text", "number"]),
  options: z.array(z.string()).optional(),
  mapsToIntentWeight: z.number(),
});

const UpdateSchema = z.object({
  questions: z.array(QuestionSchema),
});

export async function GET(_req: Request) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const businessId = business.id;
  const questions = await prisma.chatbotQuestion.findMany({ where: { businessId }, orderBy: { order: "asc" } });
  return NextResponse.json({ questions });
}

export async function PUT(req: Request) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const businessId = business.id;

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.chatbotQuestion.deleteMany({ where: { businessId } });
  const created = await Promise.all(
    parsed.data.questions.map(q =>
      prisma.chatbotQuestion.create({
        data: {
          businessId,
          order: q.order,
          questionText: q.questionText,
          type: q.type,
          options: q.options ? JSON.stringify(q.options) : null,
          mapsToIntentWeight: q.mapsToIntentWeight,
        },
      })
    )
  );
  return NextResponse.json({ questions: created });
}
