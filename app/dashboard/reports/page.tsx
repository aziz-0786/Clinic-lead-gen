"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from "@/components/dashboard/Charts";
import { formatCurrency } from "@/lib/utils";
import { Download, Lock, TrendingDown, Target, Users, BarChart3, AlertCircle, CalendarX } from "lucide-react";
import { getTierFeatures } from "@/lib/tier";

const MONTH_OPTIONS = (() => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    opts.push({ value, label });
  }
  return opts;
})();

export default function ReportsPage() {
  const [month, setMonth] = useState(MONTH_OPTIONS[0].value);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Prevent repeated auto-switch: only redirect once on initial load
  const didAutoSwitch = useRef(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/monthly?month=${month}`)
      .then(r => r.json())
      .then(d => {
        // If this is the very first load and current month is empty, silently switch to previous month
        if (!didAutoSwitch.current && d.totalLeads === 0 && month === MONTH_OPTIONS[0].value && MONTH_OPTIONS.length > 1) {
          didAutoSwitch.current = true;
          setMonth(MONTH_OPTIONS[1].value);
          return; // will re-run effect with previous month
        }
        didAutoSwitch.current = true;
        setData(d);
        setLoading(false);
      });
  }, [month]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ["Month", data.month],
      ["Total Leads", data.totalLeads],
      ["High Intent", data.byIntent.HIGH],
      ["Medium Intent", data.byIntent.MEDIUM],
      ["Low Intent", data.byIntent.LOW],
      ["Booked", data.byStatus.BOOKED],
      ["Visited", data.byStatus.VISITED],
      ["Booking Rate %", data.bookingRate],
      ["Est. Revenue (₹)", data.estimatedRevenue],
      ["Missed Leads", data.missedLeads],
      ["Est. Missed Value (₹)", data.estimatedMissedOpportunityValue],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report-${data.month}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const features = data ? getTierFeatures(data.tier) : null;

  const intentChartData = data ? [
    { name: "HIGH", value: data.byIntent.HIGH, fill: "#ef4444" },
    { name: "MEDIUM", value: data.byIntent.MEDIUM, fill: "#f59e0b" },
    { name: "LOW", value: data.byIntent.LOW, fill: "#94a3b8" },
  ] : [];

  const statusChartData = data ? [
    { name: "New", value: data.byStatus.NEW },
    { name: "Contacted", value: data.byStatus.CONTACTED },
    { name: "Booked", value: data.byStatus.BOOKED },
    { name: "Visited", value: data.byStatus.VISITED },
    { name: "No-Show", value: data.byStatus.NO_SHOW },
    { name: "Lost", value: data.byStatus.LOST },
  ] : [];

  const selectedLabel = MONTH_OPTIONS.find(o => o.value === month)?.label ?? month;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Monthly Report</h1>
        <div className="flex items-center gap-3">
          <Select value={month} onValueChange={v => { didAutoSwitch.current = true; setMonth(v); }}>
            <SelectTrigger className="w-48 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTH_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data || data.totalLeads === 0}>
            <Download className="h-4 w-4 mr-1.5" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/reports/pdf?month=${month}`, '_blank')} disabled={!data || data.totalLeads === 0}>
            <Download className="h-4 w-4 mr-1.5" />PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading report…</div>
      ) : data?.totalLeads === 0 ? (
        /* Empty state — no leads for the selected month */
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 mx-auto flex items-center justify-center">
              <CalendarX className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">No data for {selectedLabel}</p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              No inquiries were recorded in this period. Select a different month, or share your demo page to start collecting leads.
            </p>
            {MONTH_OPTIONS.length > 1 && month === MONTH_OPTIONS[0].value && (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setMonth(MONTH_OPTIONS[1].value)}>
                View {MONTH_OPTIONS[1].label}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Inquiries", value: data.totalLeads, icon: Users },
              { label: "High Intent", value: data.byIntent.HIGH, icon: Target, note: "need fast follow-up" },
              { label: "Booking Rate", value: `${data.bookingRate}%`, icon: BarChart3 },
              { label: "Est. Revenue", value: formatCurrency(data.estimatedRevenue), icon: TrendingDown },
            ].map(k => (
              <Card key={k.label}>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-bold mt-1">{k.value}</p>
                  {k.note && <p className="text-xs text-slate-400">{k.note}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts (Growth/Pro only) */}
          {features?.monthlyReportFull ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Intent Distribution</CardTitle></CardHeader>
                <CardContent><DashboardCharts type="pie" data={intentChartData} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Leads by Status</CardTitle></CardHeader>
                <CardContent><DashboardCharts type="bar" data={statusChartData} /></CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-dashed border-slate-200">
              <CardContent className="py-10 text-center">
                <Lock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-700">Full Charts — Growth & Pro</p>
                <p className="text-sm text-slate-400 mt-1">Upgrade to see intent distribution, status breakdown, and trend charts.</p>
                <Button size="sm" className="mt-4">Upgrade Plan</Button>
              </CardContent>
            </Card>
          )}

          {/* Missed Opportunity Calculator */}
          <MissedOpportunityCalculator
            data={data}
            unlocked={!!features?.missedOpportunityCalculator}
          />

          {/* Status breakdown table */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Status Breakdown</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 text-slate-400 font-normal">Status</th><th className="text-right py-2 text-slate-400 font-normal">Count</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {Object.entries(data.byStatus).map(([s, c]) => (
                    <tr key={s}><td className="py-2 text-slate-700">{s}</td><td className="py-2 text-right font-medium">{c as number}</td></tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MissedOpportunityCalculator({ data, unlocked }: { data: any; unlocked: boolean }) {
  const [patientValue, setPatientValue] = useState(data.avgPatientValue);

  const missedRevenue = data.missedLeads * patientValue;
  const missedHigh = Math.round(data.byIntent.HIGH * 0.6);
  const missedMedium = Math.round(data.byIntent.MEDIUM * 0.3);

  return (
    <Card className={unlocked ? "border-amber-200 bg-amber-50/30" : "border-2 border-dashed border-slate-200"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base text-amber-900">Missed-Opportunity Calculator</CardTitle>
          </div>
          {!unlocked && <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Pro Only</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {unlocked ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-amber-200">
                <p className="text-xs text-slate-500">High Intent Lost</p>
                <p className="text-2xl font-bold text-red-600">{missedHigh}</p>
                <p className="text-xs text-slate-400">leads without follow-up</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-amber-200">
                <p className="text-xs text-slate-500">Medium Intent Lost</p>
                <p className="text-2xl font-bold text-amber-600">{missedMedium}</p>
                <p className="text-xs text-slate-400">leads without follow-up</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-red-200">
                <p className="text-xs text-slate-500">Total Revenue at Risk</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(missedRevenue)}</p>
                <p className="text-xs text-slate-400">based on ₹{patientValue.toLocaleString()}/patient</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <label className="text-sm font-medium text-slate-700 block mb-2">Adjust Avg. Patient Value (₹)</label>
              <input
                type="range" min={500} max={20000} step={500}
                value={patientValue}
                onChange={e => setPatientValue(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>₹500</span><span className="font-semibold text-amber-700">₹{patientValue.toLocaleString()}</span><span>₹20,000</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-amber-100">
              <strong className="text-amber-800">Key insight:</strong> {data.missedLeads} high/medium-intent inquiries from {data.month} didn't convert to booked visits. At your average patient value of {formatCurrency(patientValue)}, that's <strong className="text-red-700">{formatCurrency(missedRevenue)} in potential revenue left on the table</strong> from slow follow-up.
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">See exactly how much revenue you're leaving on the table from missed follow-ups.</p>
            <p className="text-slate-400 text-xs mt-1">Available on the Pro plan.</p>
            <Button size="sm" className="mt-4">Upgrade to Pro</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
