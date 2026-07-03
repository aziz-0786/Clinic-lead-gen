"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, Table2, Search, Phone } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Lead = {
  id: string; name: string; phone: string; email?: string;
  concernType: string; urgency: string; visitMode: string; patientType: string;
  intentLabel: string; intentScore: number; status: string;
  createdAt: string;
};

const STATUS_COLS = ["NEW", "CONTACTED", "BOOKED", "VISITED", "NO_SHOW", "LOST"];
const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-50 border-blue-200",
  CONTACTED: "bg-yellow-50 border-yellow-200",
  BOOKED: "bg-green-50 border-green-200",
  VISITED: "bg-teal-50 border-teal-200",
  NO_SHOW: "bg-orange-50 border-orange-200",
  LOST: "bg-slate-50 border-slate-200",
};
const INTENT_BADGE: Record<string, "destructive" | "warning" | "secondary"> = {
  HIGH: "destructive", MEDIUM: "warning", LOW: "secondary",
};
const URGENCY_LABEL: Record<string, string> = {
  EMERGENCY_TODAY: "🚨 Emergency",
  THIS_WEEK: "⚡ This week",
  THIS_MONTH: "📅 This month",
  JUST_EXPLORING: "🔍 Exploring",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [filterIntent, setFilterIntent] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterUrgency, setFilterUrgency] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterIntent !== "ALL") params.set("intent", filterIntent);
    if (filterStatus !== "ALL") params.set("status", filterStatus);
    if (filterUrgency !== "ALL") params.set("urgency", filterUrgency);
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    const sorted = (data.leads as Lead[]).sort((a, b) => {
      const uo: Record<string, number> = { EMERGENCY_TODAY: 0, THIS_WEEK: 1, THIS_MONTH: 2, JUST_EXPLORING: 3 };
      return (uo[a.urgency] ?? 3) - (uo[b.urgency] ?? 3);
    });
    setLeads(sorted);
    setLoading(false);
  }, [filterIntent, filterStatus, filterUrgency, search, dateFrom, dateTo]);

  useEffect(() => { fetchLeads(); }, [filterIntent, filterStatus, filterUrgency]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); fetchLeads(); }
  function clearFilters() {
    setFilterIntent("ALL"); setFilterStatus("ALL"); setFilterUrgency("ALL");
    setSearch(""); setDateFrom(""); setDateTo("");
  }

  const emergencyCount = leads.filter(l => l.urgency === "EMERGENCY_TODAY").length;
  const concernTypes = Array.from(new Set(leads.map(l => l.concernType))).sort();

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm">
            {leads.length} inquiries
            {emergencyCount > 0 && <> · <span className="text-red-600 font-semibold">{emergencyCount} emergency</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant={view === "table" ? "default" : "outline"} size="sm" onClick={() => setView("table")}>
            <Table2 className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Table</span>
          </Button>
          <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}>
            <LayoutGrid className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Kanban</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Row 1: search + dropdowns */}
        <div className="flex flex-wrap gap-2 items-center">
          <form onSubmit={handleSearch} className="flex gap-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 w-36 sm:w-44 h-9 text-sm"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-9 px-2.5">
              <Search className="h-3.5 w-3.5" />
            </Button>
          </form>

          <Select value={filterIntent} onValueChange={setFilterIntent}>
            <SelectTrigger className="w-28 sm:w-32 h-9 text-sm"><SelectValue placeholder="Intent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Intent</SelectItem>
              <SelectItem value="HIGH">HIGH</SelectItem>
              <SelectItem value="MEDIUM">MEDIUM</SelectItem>
              <SelectItem value="LOW">LOW</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterUrgency} onValueChange={setFilterUrgency}>
            <SelectTrigger className="w-32 sm:w-36 h-9 text-sm"><SelectValue placeholder="Urgency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Urgency</SelectItem>
              <SelectItem value="EMERGENCY_TODAY">Emergency</SelectItem>
              <SelectItem value="THIS_WEEK">This Week</SelectItem>
              <SelectItem value="THIS_MONTH">This Month</SelectItem>
              <SelectItem value="JUST_EXPLORING">Exploring</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 sm:w-32 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              {STATUS_COLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          {(filterIntent !== "ALL" || filterStatus !== "ALL" || filterUrgency !== "ALL" || search || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-9 text-xs text-slate-400" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>

        {/* Row 2: date range (hidden on very small screens) */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-xs text-slate-400">From</span>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-36 text-sm" />
          <span className="text-xs text-slate-400">to</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-36 text-sm" />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-9 text-xs text-slate-400" onClick={() => { setDateFrom(""); setDateTo(""); }}>✕</Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No leads found.</div>
      ) : view === "table" ? (
        <TableView leads={leads} />
      ) : (
        <KanbanView leads={leads} />
      )}
    </div>
  );
}

function TableView({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  return (
    <div className="rounded-xl border bg-white overflow-x-auto">
      <table className="w-full min-w-[580px] text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            {["Patient", "Concern", "Urgency", "Intent", "Status", "Date"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map(lead => (
            <tr
              key={lead.id}
              onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
              className={`hover:bg-slate-50 cursor-pointer transition-colors ${lead.urgency === "EMERGENCY_TODAY" ? "bg-red-50/40 border-l-4 border-l-red-500" : ""}`}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{lead.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />{lead.phone}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600 text-xs">{lead.concernType}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-medium ${lead.urgency === "EMERGENCY_TODAY" ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                  {URGENCY_LABEL[lead.urgency] ?? lead.urgency}
                </span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={INTENT_BADGE[lead.intentLabel]}>{lead.intentLabel}</Badge>
                <span className="ml-1.5 text-xs text-slate-400">{lead.intentScore}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[lead.status] ?? ""}`}>
                  {lead.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(lead.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KanbanView({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUS_COLS.map(status => {
        const col = leads.filter(l => l.status === status);
        return (
          <div key={status} className="min-w-[190px] flex-shrink-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{status}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{col.length}</span>
            </div>
            <div className="space-y-2">
              {col.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                  className={`p-3 rounded-lg border bg-white hover:shadow-md transition-shadow cursor-pointer ${lead.urgency === "EMERGENCY_TODAY" ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                >
                  {lead.urgency === "EMERGENCY_TODAY" && (
                    <div className="text-xs text-red-600 font-semibold mb-1">🚨 Emergency</div>
                  )}
                  <p className="text-sm font-medium text-slate-900 leading-tight">{lead.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{lead.concernType}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant={INTENT_BADGE[lead.intentLabel]} className="text-[10px] px-1.5 py-0">
                      {lead.intentLabel}
                    </Badge>
                    <span className="text-[10px] text-slate-400 ml-auto">{formatDate(lead.createdAt)}</span>
                  </div>
                </div>
              ))}
              {col.length === 0 && (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-300">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
