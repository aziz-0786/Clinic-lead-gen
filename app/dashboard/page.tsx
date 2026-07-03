import { getCurrentBusiness } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from "@/components/dashboard/Charts";
import { Users, TrendingUp, Calendar, DollarSign, AlertCircle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getTrend(current: number, previous: number) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { pct: 100, up: true };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;
  const businessId = business.id;

  const now = new Date();
  // Rolling 30-day window — never resets to 0 on the 1st of a month
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [recentLeads, periodLeads, prevLeads] = await Promise.all([
    prisma.lead.findMany({ where: { businessId }, orderBy: { createdAt: "desc" }, take: 5 }),
    // Current 30-day window
    prisma.lead.findMany({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    // Previous 30-day window (for trend)
    prisma.lead.findMany({ where: { businessId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
  ]);

  // Current period KPIs
  const totalPeriod      = periodLeads.length;
  const highIntentCount  = periodLeads.filter(l => l.intentLabel === "HIGH" || l.urgency === "EMERGENCY_TODAY").length;
  const booked           = periodLeads.filter(l => ["BOOKED", "VISITED"].includes(l.status)).length;
  const bookingRate      = totalPeriod > 0 ? Math.round((booked / totalPeriod) * 100) : 0;
  const estimatedRevenue = booked * business.avgPatientValue;

  // Previous period KPIs (for trend arrows)
  const prevTotal       = prevLeads.length;
  const prevHighIntent  = prevLeads.filter(l => l.intentLabel === "HIGH" || l.urgency === "EMERGENCY_TODAY").length;
  const prevBooked      = prevLeads.filter(l => ["BOOKED", "VISITED"].includes(l.status)).length;
  const prevBookingRate = prevTotal > 0 ? Math.round((prevBooked / prevTotal) * 100) : 0;
  const prevRevenue     = prevBooked * business.avgPatientValue;

  const urgencyOrder: Record<string, number> = { EMERGENCY_TODAY: 0, THIS_WEEK: 1, THIS_MONTH: 2, JUST_EXPLORING: 3 };
  const sortedRecent = [...recentLeads].sort((a, b) => (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3));

  const kpis = [
    {
      label: "Inquiries (30 days)",
      value: totalPeriod,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: getTrend(totalPeriod, prevTotal),
    },
    {
      label: "Emergency / High Intent",
      value: highIntentCount,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      trend: getTrend(highIntentCount, prevHighIntent),
    },
    {
      label: "Booking Rate",
      value: `${bookingRate}%`,
      icon: Calendar,
      color: "text-green-600",
      bg: "bg-green-50",
      trend: getTrend(bookingRate, prevBookingRate),
    },
    {
      label: "Est. Revenue (Booked)",
      value: formatCurrency(estimatedRevenue),
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-50",
      trend: getTrend(estimatedRevenue, prevRevenue),
    },
  ];

  const intentData = [
    { name: "HIGH",   value: periodLeads.filter(l => l.intentLabel === "HIGH").length,   fill: "#ef4444" },
    { name: "MEDIUM", value: periodLeads.filter(l => l.intentLabel === "MEDIUM").length, fill: "#f59e0b" },
    { name: "LOW",    value: periodLeads.filter(l => l.intentLabel === "LOW").length,    fill: "#6b7280" },
  ].filter(d => d.value > 0); // hide zero slices

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const count = periodLeads.filter(l => new Date(l.createdAt).toDateString() === d.toDateString()).length;
    return { name: key, Inquiries: count };
  });

  const urgencyLabel: Record<string, string> = {
    EMERGENCY_TODAY: "Emergency",
    THIS_WEEK: "This Week",
    THIS_MONTH: "This Month",
    JUST_EXPLORING: "Exploring",
  };
  const intentColor: Record<string, string> = { HIGH: "destructive", MEDIUM: "warning", LOW: "secondary" };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting()}, {business.ownerName.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {business.name} · {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  {/* Trend vs previous 30 days */}
                  {kpi.trend ? (
                    <p className={`text-xs mt-1 flex items-center gap-0.5 ${kpi.trend.up ? "text-green-600" : "text-red-500"}`}>
                      {kpi.trend.up
                        ? <ArrowUpRight className="h-3 w-3" />
                        : <ArrowDownRight className="h-3 w-3" />}
                      {kpi.trend.pct}% vs prev 30d
                    </p>
                  ) : (
                    <p className="text-xs mt-1 flex items-center gap-0.5 text-slate-400">
                      <Minus className="h-3 w-3" /> no prev data
                    </p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Inquiries — Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            <DashboardCharts type="line" data={last7} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Intent Breakdown (30d)</CardTitle></CardHeader>
          <CardContent>
            {intentData.length > 0 ? (
              <DashboardCharts type="pie" data={intentData} />
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No leads yet in this period</p>
                <p className="text-xs text-slate-400">Share your demo page to start receiving inquiries</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Leads</CardTitle>
          <Link href="/dashboard/leads" className="text-sm text-cyan-600 hover:underline flex items-center gap-1">
            View all <TrendingUp className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {sortedRecent.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-14 h-14 rounded-full bg-slate-100 mx-auto flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No leads yet</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Share your clinic&apos;s demo page to start collecting patient inquiries automatically.
              </p>
              <Link
                href={`/demo/${business.slug}`}
                className="inline-block mt-2 text-xs font-semibold text-cyan-600 hover:underline"
              >
                View your demo page →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRecent.map(lead => (
                <Link key={lead.id} href={`/dashboard/leads/${lead.id}`}>
                  <div className={`flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${lead.urgency === "EMERGENCY_TODAY" ? "border-l-4 border-red-500 bg-red-50/30" : ""}`}>
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                      {lead.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.concernType} · {lead.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.urgency === "EMERGENCY_TODAY" && <Badge variant="emergency">🚨 Emergency</Badge>}
                      <Badge variant={intentColor[lead.intentLabel] as any}>{lead.intentLabel}</Badge>
                      <span className="text-xs text-slate-400 hidden sm:block">{urgencyLabel[lead.urgency]}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
