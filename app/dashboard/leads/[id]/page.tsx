"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime, formatDate } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, MessageCircle, Repeat, CheckCircle, AlertCircle, Clock, Calendar } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "BOOKED", "VISITED", "NO_SHOW", "LOST"];
const URGENCY_LABEL: Record<string, string> = {
  EMERGENCY_TODAY: "🚨 Emergency — Today",
  THIS_WEEK: "⚡ This Week",
  THIS_MONTH: "📅 This Month",
  JUST_EXPLORING: "🔍 Just Exploring",
};
const INTENT_BADGE: Record<string, any> = { HIGH: "destructive", MEDIUM: "warning", LOW: "secondary" };

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sequencing, setSequencing] = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then(r => r.json())
      .then(d => {
        setLead(d.lead);
        setStatus(d.lead.status);
        setNotes(d.lead.notes ?? "");
        setApptTime(d.lead.appointmentTime ? new Date(d.lead.appointmentTime).toISOString().slice(0, 16) : "");
        setLoading(false);
      });
  }, [id]);

  async function save() {
    setSaving(true);
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes, appointmentTime: apptTime || null }),
    });
    setSaving(false);
    setAlertMsg({ type: "success", text: "Saved." });
    setTimeout(() => setAlertMsg(null), 2000);
  }

  async function sendAlert(channel: string) {
    const res = await fetch(`/api/leads/${id}/alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    const data = await res.json();
    if (res.ok) {
      setAlertMsg({ type: "success", text: `${channel === "email" ? "Email" : "WhatsApp"} alert sent.` });
    } else {
      setAlertMsg({ type: "error", text: data.error ?? "Failed to send." });
    }
    setTimeout(() => setAlertMsg(null), 3000);
  }

  async function startFollowUp() {
    setSequencing(true);
    const res = await fetch(`/api/leads/${id}/followup`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setLead((l: any) => ({ ...l, followUpSequences: data.sequences }));
      setAlertMsg({ type: "success", text: "Follow-up sequence started (Day 1, 3, 7)." });
    } else {
      setAlertMsg({ type: "error", text: data.error ?? "Failed." });
    }
    setSequencing(false);
    setTimeout(() => setAlertMsg(null), 3000);
  }

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  if (!lead) return <div className="p-8 text-slate-400">Lead not found.</div>;

  const answers = (() => { try { return JSON.parse(lead.answers); } catch { return {}; } })();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        {lead.urgency === "EMERGENCY_TODAY" && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200">
            <AlertCircle className="h-4 w-4" /> Emergency inquiry — contact this patient immediately
          </div>
        )}
      </div>

      {alertMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${alertMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {alertMsg.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {alertMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main profile */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600">{lead.name[0]}</div>
                  <div>
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-600"><Phone className="h-3.5 w-3.5" />{lead.phone}</a>
                      {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-600"><Mail className="h-3.5 w-3.5" />{lead.email}</a>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={INTENT_BADGE[lead.intentLabel]}>{lead.intentLabel}</Badge>
                  <span className="text-xs text-slate-400">Score: {lead.intentScore}/100</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ["Concern", lead.concernType],
                  ["Urgency", URGENCY_LABEL[lead.urgency] ?? lead.urgency],
                  ["Visit Mode", lead.visitMode],
                  ["Patient Type", lead.patientType],
                  ["Source", lead.source],
                  ["Received", formatDateTime(lead.createdAt)],
                  lead.lastContactedAt && ["Last Contacted", formatDateTime(lead.lastContactedAt)],
                  lead.appointmentTime && ["Appointment", formatDateTime(lead.appointmentTime)],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-slate-400 text-xs">{label}</dt>
                    <dd className="font-medium text-slate-800">{value as string}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Q&A Transcript */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Chatbot Transcript</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(answers).map(([key, val]) => (
                  <div key={key} className="flex gap-3 text-sm">
                    <span className="text-slate-400 w-8 shrink-0">{key}</span>
                    <span className="text-slate-700">{String(val)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alert history */}
          {lead.alertLogs?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Alert History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lead.alertLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-slate-600 capitalize">{log.channel} alert</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${log.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{log.status}</span>
                        <span className="text-xs text-slate-400">{formatDate(log.sentAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Update Lead</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Appointment Time</Label>
                <Input type="datetime-local" value={apptTime} onChange={e => setApptTime(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes…" rows={3} className="text-sm" />
              </div>
              <Button className="w-full" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Manual Alerts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => sendAlert("email")}>
                <Mail className="h-4 w-4" /> Send Email Alert
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={() => sendAlert("whatsapp")}>
                <MessageCircle className="h-4 w-4" /> Send WhatsApp Alert
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={startFollowUp} disabled={sequencing}>
                <Repeat className="h-4 w-4" /> {sequencing ? "Starting…" : "Start Follow-Up Sequence"}
              </Button>
            </CardContent>
          </Card>

          {/* Follow-up sequences */}
          {lead.followUpSequences?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Follow-Up Sequence</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lead.followUpSequences.map((seq: any) => (
                    <div key={seq.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-600">Day {seq.day} · {seq.channel}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${seq.status === "sent" ? "bg-green-100 text-green-700" : seq.status === "skipped" ? "bg-slate-100 text-slate-500" : "bg-yellow-100 text-yellow-700"}`}>
                        {seq.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
