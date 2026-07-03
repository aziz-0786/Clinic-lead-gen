import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/business";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business configured" }, { status: 500 });
  const businessId = business.id;

  const { searchParams } = new URL(req.url);
  const monthStr = searchParams.get("month") ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [y, m] = monthStr.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const leads = await prisma.lead.findMany({ where: { businessId, createdAt: { gte: start, lt: end } } });

  const totalLeads = leads.length;
  const byIntent = {
    HIGH: leads.filter(l => l.intentLabel === "HIGH").length,
    MEDIUM: leads.filter(l => l.intentLabel === "MEDIUM").length,
    LOW: leads.filter(l => l.intentLabel === "LOW").length,
  };
  const byStatus = {
    NEW: leads.filter(l => l.status === "NEW").length,
    CONTACTED: leads.filter(l => l.status === "CONTACTED").length,
    BOOKED: leads.filter(l => l.status === "BOOKED").length,
    VISITED: leads.filter(l => l.status === "VISITED").length,
    NO_SHOW: leads.filter(l => l.status === "NO_SHOW").length,
    LOST: leads.filter(l => l.status === "LOST").length,
  };
  const booked = byStatus.BOOKED + byStatus.VISITED;
  const bookingRate = totalLeads > 0 ? Math.round((booked / totalLeads) * 100) : 0;
  const estimatedRevenue = booked * business.avgPatientValue;

  // Missed opportunity: High/Medium that never reached Booked/Visited
  const missedLeads = leads.filter(l =>
    (l.intentLabel === "HIGH" || l.intentLabel === "MEDIUM") &&
    !["BOOKED", "VISITED"].includes(l.status)
  );
  const estimatedMissedOpportunityValue = missedLeads.length * business.avgPatientValue;

  // Build daily chart data
  const daysInMonth = end.getDate() - start.getDate();
  const dailyMap: Record<string, number> = {};
  for (const lead of leads) {
    const d = new Date(lead.createdAt).getDate();
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dailyMap[key] = (dailyMap[key] ?? 0) + 1;
  }

  // Urgency breakdown
  const byUrgency = {
    EMERGENCY_TODAY: leads.filter(l => l.urgency === "EMERGENCY_TODAY").length,
    THIS_WEEK: leads.filter(l => l.urgency === "THIS_WEEK").length,
    THIS_MONTH: leads.filter(l => l.urgency === "THIS_MONTH").length,
    JUST_EXPLORING: leads.filter(l => l.urgency === "JUST_EXPLORING").length,
  };

  return NextResponse.json({
    month: monthStr,
    totalLeads,
    byIntent,
    byStatus,
    byUrgency,
    bookingRate,
    estimatedRevenue,
    missedLeads: missedLeads.length,
    estimatedMissedOpportunityValue,
    avgPatientValue: business.avgPatientValue,
    dailyMap,
    tier: business.tier,
  });
}
