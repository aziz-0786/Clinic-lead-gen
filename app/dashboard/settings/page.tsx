"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock } from "lucide-react";
import { getTierFeatures, TIER_LABELS, TIER_COLORS } from "@/lib/tier";

const SPECIALTIES = ["Dental", "Multi-Specialty", "Skin/Cosmetic", "General Physician", "Other"];

export default function SettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => setBusiness(d.business));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: business.name, ownerName: business.ownerName, city: business.city,
        phone: business.phone, whatsappNumber: business.whatsappNumber,
        alertEmail: business.alertEmail, specialty: business.specialty,
        avgPatientValue: Number(business.avgPatientValue),
        avgInquiryToBookingRate: Number(business.avgInquiryToBookingRate),
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!business) return <div className="p-8 text-slate-400">Loading…</div>;

  const features = getTierFeatures(business.tier);
  const tierColor = TIER_COLORS[business.tier as keyof typeof TIER_COLORS] ?? "bg-slate-100 text-slate-700";

  const FEATURE_ROWS = [
    { label: "Chatbot Widget", starter: true, growth: true, pro: true },
    { label: "Email alert on High-intent inquiry", starter: false, growth: true, pro: true },
    { label: "WhatsApp alert on Emergency/High-intent", starter: false, growth: false, pro: true },
    { label: "Full monthly report (charts)", starter: false, growth: true, pro: true },
    { label: "Missed-Opportunity Calculator", starter: false, growth: false, pro: true },
    { label: "Follow-up sequence automation", starter: false, growth: true, pro: true },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* Tier & features */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Your Plan</CardTitle>
              <CardDescription>Feature access based on your current tier.</CardDescription>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${tierColor}`}>{TIER_LABELS[business.tier as keyof typeof TIER_LABELS] ?? business.tier}</span>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-slate-500 font-medium">Feature</th>
                {(["STARTER", "GROWTH", "PRO"] as const).map(t => (
                  <th key={t} className={`text-center py-2 text-xs font-semibold ${business.tier === t ? "text-cyan-700" : "text-slate-400"}`}>
                    {t === business.tier ? "✓ " : ""}{TIER_LABELS[t]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {FEATURE_ROWS.map(row => (
                <tr key={row.label}>
                  <td className="py-2.5 text-slate-700">{row.label}</td>
                  {[row.starter, row.growth, row.pro].map((has, i) => (
                    <td key={i} className="py-2.5 text-center">
                      {has ? <span className="text-green-500">✓</span> : <Lock className="h-3.5 w-3.5 text-slate-200 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {business.tier !== "PRO" && (
            <div className="mt-4 p-3 bg-cyan-50 rounded-lg border border-cyan-100 flex items-center justify-between">
              <p className="text-sm text-cyan-800">Unlock WhatsApp alerts and the Missed-Opportunity Calculator.</p>
              <Button size="sm" className="ml-4 shrink-0">Upgrade to Pro</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clinic Profile</CardTitle>
          <CardDescription>This information appears on your demo landing page.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Clinic Name</Label>
                <Input value={business.name} onChange={e => setBusiness({ ...business, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Doctor / Owner Name</Label>
                <Input value={business.ownerName} onChange={e => setBusiness({ ...business, ownerName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input value={business.city} onChange={e => setBusiness({ ...business, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Specialty</Label>
                <Select value={business.specialty} onValueChange={v => setBusiness({ ...business, specialty: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={business.phone} onChange={e => setBusiness({ ...business, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">WhatsApp Number</Label>
                <Input value={business.whatsappNumber} onChange={e => setBusiness({ ...business, whatsappNumber: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Alert Email (receives high-intent notifications)</Label>
                <Input type="email" value={business.alertEmail} onChange={e => setBusiness({ ...business, alertEmail: e.target.value })} />
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-slate-600 mb-3">Revenue Metrics (used in Missed-Opportunity Calculator)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Avg. Patient Value (₹)</Label>
                  <Input type="number" value={business.avgPatientValue} onChange={e => setBusiness({ ...business, avgPatientValue: e.target.value })} min={100} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Avg. Inquiry-to-Booking Rate (%)</Label>
                  <Input type="number" value={business.avgInquiryToBookingRate} onChange={e => setBusiness({ ...business, avgInquiryToBookingRate: e.target.value })} min={0} max={100} />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saved ? <><CheckCircle className="h-4 w-4 mr-1.5" />Saved</> : saving ? "Saving…" : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
