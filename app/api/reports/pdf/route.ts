import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as any).businessId;

  const { searchParams } = new URL(req.url);
  const monthStr = searchParams.get("month") ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [y, m] = monthStr.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const [leads, business] = await Promise.all([
    prisma.lead.findMany({ where: { businessId, createdAt: { gte: start, lt: end } } }),
    prisma.business.findUnique({ where: { id: businessId } }),
  ]);

  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  const missedLeads = leads.filter(l =>
    (l.intentLabel === "HIGH" || l.intentLabel === "MEDIUM") && !["BOOKED", "VISITED"].includes(l.status)
  );
  const missedValue = missedLeads.length * business.avgPatientValue;
  const monthLabel = start.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const statusRows = Object.entries(byStatus)
    .map(([s, c]) => `<tr><td>${s}</td><td style="text-align:right">${c}</td></tr>`)
    .join("");

  const intentRows = Object.entries(byIntent)
    .map(([label, c]) => `<tr><td>${label}</td><td style="text-align:right">${c}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Monthly Report — ${business.name} — ${monthLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 13px; padding: 40px; }
  h1 { font-size: 22px; font-weight: 700; color: ${business.brandColor}; }
  h2 { font-size: 14px; font-weight: 600; margin: 24px 0 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta { color: #64748b; font-size: 12px; margin-top: 4px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
  .kpi .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
  .kpi .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .missed-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-top: 20px; }
  .missed-box .amount { font-size: 28px; font-weight: 700; color: #c2410c; margin: 8px 0; }
  footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="no-print" style="background:#0891b2;color:white;padding:12px 20px;margin:-40px -40px 30px;display:flex;align-items:center;justify-content:space-between">
  <span style="font-weight:600">Monthly Report Preview</span>
  <button onclick="window.print()" style="background:white;color:#0891b2;border:none;padding:6px 16px;border-radius:6px;font-weight:600;cursor:pointer">Print / Save PDF</button>
</div>

<h1>${business.name}</h1>
<p class="meta">Monthly Patient Inquiry Report · ${monthLabel} · Generated ${new Date().toLocaleDateString("en-IN")}</p>

<div class="kpi-grid">
  <div class="kpi"><div class="label">Total Inquiries</div><div class="value">${totalLeads}</div></div>
  <div class="kpi"><div class="label">High Intent</div><div class="value" style="color:#ef4444">${byIntent.HIGH}</div></div>
  <div class="kpi"><div class="label">Booking Rate</div><div class="value">${bookingRate}%</div></div>
  <div class="kpi"><div class="label">Est. Revenue</div><div class="value" style="color:#059669">${formatINR(estimatedRevenue)}</div></div>
</div>

<div class="two-col">
  <div>
    <h2>Intent Breakdown</h2>
    <table><thead><tr><th>Intent</th><th style="text-align:right">Count</th></tr></thead><tbody>${intentRows}</tbody></table>
  </div>
  <div>
    <h2>Leads by Status</h2>
    <table><thead><tr><th>Status</th><th style="text-align:right">Count</th></tr></thead><tbody>${statusRows}</tbody></table>
  </div>
</div>

<div class="missed-box">
  <strong>Missed-Opportunity Estimate</strong>
  <div class="amount">${formatINR(missedValue)}</div>
  <p style="color:#9a3412;font-size:12px">${missedLeads.length} high/medium-intent inquiries didn't convert to bookings. At ${formatINR(business.avgPatientValue)}/patient, that's an estimated ${formatINR(missedValue)} in unrealised revenue.</p>
</div>

<footer>
  ${business.name} · ${business.ownerName} · ${business.city}<br>
  Powered by ClinicLeads · Report generated ${new Date().toLocaleString("en-IN")}
</footer>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
