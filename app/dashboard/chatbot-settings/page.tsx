"use client";
import { useState, useEffect, useRef, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Plus, Trash2, Save, CheckCircle, ExternalLink, Upload, MessageCircle, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

type Question = {
  id?: string;
  order: number;
  questionText: string;
  type: "single_choice" | "text" | "number";
  options: string[];
  mapsToIntentWeight: number;
};

export default function ChatbotSettingsPage() {
  const { data: session } = useSession();
  const slug = (session?.user as any)?.businessSlug;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [brandColor, setBrandColor] = useState("#0891b2");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/chatbot-settings")
      .then(r => r.json())
      .then(d => setQuestions(d.questions.map((q: any) => ({ ...q, options: q.options ? JSON.parse(q.options) : [] }))));
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        setBrandColor(d.business?.brandColor ?? "#0891b2");
        setLogoUrl(d.business?.logoUrl ?? null);
        setClinicName(d.business?.name ?? "");
      });
  }, []);

  // ── Drag-to-reorder handlers ──────────────────────────────────────
  function onDragStart(e: DragEvent, i: number) {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: DragEvent, i: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(i);
  }
  function onDrop(e: DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    setQuestions(qs => {
      const next = [...qs];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(i, 0, moved);
      return next.map((q, qi) => ({ ...q, order: qi + 1 }));
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }
  function onDragEnd() { setDragIdx(null); setDragOverIdx(null); }

  // ── Question editing ──────────────────────────────────────────────
  function updateQ(i: number, field: keyof Question, value: any) {
    setQuestions(qs => qs.map((q, qi) => qi === i ? { ...q, [field]: value } : q));
  }
  function addOption(i: number) {
    setQuestions(qs => qs.map((q, qi) => qi === i ? { ...q, options: [...q.options, "New option"] } : q));
  }
  function updateOption(qi: number, oi: number, val: string) {
    setQuestions(qs => qs.map((q, qii) => qii === qi ? { ...q, options: q.options.map((o, oii) => oii === oi ? val : o) } : q));
  }
  function removeOption(qi: number, oi: number) {
    setQuestions(qs => qs.map((q, qii) => qii === qi ? { ...q, options: q.options.filter((_, oii) => oii !== oi) } : q));
  }
  function addQuestion() {
    setQuestions(qs => [...qs, { order: qs.length + 1, questionText: "New question?", type: "single_choice", options: ["Option A", "Option B"], mapsToIntentWeight: 0 }]);
  }
  function removeQuestion(i: number) {
    setQuestions(qs => qs.filter((_, qi) => qi !== i).map((q, qi) => ({ ...q, order: qi + 1 })));
  }

  // ── Logo upload ───────────────────────────────────────────────────
  async function handleLogoUpload(file: File) {
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setLogoUrl(data.logoUrl);
    } else {
      setUploadError(data.error ?? "Upload failed");
    }
    setUploading(false);
  }

  // ── Save ─────────────────────────────────────────────────────────
  async function save() {
    setSaving(true);
    await Promise.all([
      fetch("/api/chatbot-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      }),
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandColor }),
      }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chatbot Settings</h1>
          <p className="text-slate-500 text-sm">Edit questions, branding, and preview the live widget.</p>
        </div>
        <div className="flex items-center gap-3">
          {slug && (
            <a href={`/demo/${slug}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1.5" />Full Demo Page</Button>
            </a>
          )}
          <Button onClick={save} disabled={saving} size="sm">
            {saved
              ? <><CheckCircle className="h-4 w-4 mr-1.5" />Saved</>
              : <><Save className="h-4 w-4 mr-1.5" />{saving ? "Saving…" : "Save All"}</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left: config */}
        <div className="xl:col-span-3 space-y-5">
          {/* Branding */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Branding</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {/* Color */}
              <div>
                <Label className="text-xs mb-2 block">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                  />
                  <Input
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-32 h-9 text-sm font-mono"
                    placeholder="#0891b2"
                  />
                  <div className="w-10 h-10 rounded-lg border border-slate-100" style={{ backgroundColor: brandColor }} />
                  <span className="text-xs text-slate-400">Used on the widget header and buttons</span>
                </div>
              </div>

              {/* Logo */}
              <div>
                <Label className="text-xs mb-2 block">Clinic Logo</Label>
                <div className="flex items-start gap-4">
                  <div
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-slate-300 transition-colors overflow-hidden bg-slate-50"
                    onClick={() => fileRef.current?.click()}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="h-5 w-5 text-slate-300 mx-auto" />
                        <span className="text-[10px] text-slate-400 mt-1 block">Upload</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="text-xs"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {uploading ? "Uploading…" : "Upload Logo"}
                    </Button>
                    {logoUrl && (
                      <button
                        onClick={() => setLogoUrl(null)}
                        className="ml-2 text-xs text-slate-400 hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">PNG, JPG, SVG · max 2 MB</p>
                    {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">Qualifying Questions</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Drag to reorder · Click to edit</p>
              </div>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1.5" />Add Question
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {questions.map((q, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={e => onDragStart(e, i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDrop={e => onDrop(e, i)}
                  onDragEnd={onDragEnd}
                  className={`border rounded-xl p-4 space-y-3 transition-all ${
                    dragIdx === i ? "opacity-40 scale-[0.98]" : ""
                  } ${
                    dragOverIdx === i && dragIdx !== i ? "border-cyan-400 bg-cyan-50/30 ring-1 ring-cyan-300" : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 touch-none"
                      onMouseDown={e => e.stopPropagation()}
                    >
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-6">Q{i + 1}</span>
                        <Input
                          value={q.questionText}
                          onChange={e => updateQ(i, "questionText", e.target.value)}
                          className="text-sm flex-1"
                          placeholder="Your question…"
                        />
                        <Select value={q.type} onValueChange={v => updateQ(i, "type", v as Question["type"])}>
                          <SelectTrigger className="w-36 h-9 text-xs flex-shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_choice">Single Choice</SelectItem>
                            <SelectItem value="text">Free Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {q.type === "single_choice" && (
                        <div className="space-y-1.5 ml-6">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                              <Input
                                value={opt}
                                onChange={e => updateOption(i, oi, e.target.value)}
                                className="text-xs h-8 flex-1"
                              />
                              <button onClick={() => removeOption(i, oi)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addOption(i)}
                            className="text-xs text-cyan-600 hover:underline ml-3.5"
                          >
                            + Add option
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeQuestion(i)}
                      className="text-slate-300 hover:text-red-500 transition-colors mt-2 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  No questions yet. Add one above.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: live preview */}
        <div className="xl:col-span-2">
          <div className="sticky top-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-cyan-600" />
                  Live Preview
                </CardTitle>
                <p className="text-xs text-slate-400">How the widget looks with your current settings</p>
              </CardHeader>
              <CardContent>
                <WidgetPreview
                  brandColor={brandColor}
                  logoUrl={logoUrl}
                  clinicName={clinicName}
                  questions={questions}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function WidgetPreview({ brandColor, logoUrl, clinicName, questions }: {
  brandColor: string;
  logoUrl: string | null;
  clinicName: string;
  questions: Question[];
}) {
  const [open, setOpen] = useState(true);
  const firstQ = questions[0];
  const firstOptions = firstQ?.type === "single_choice" ? firstQ.options : [];

  return (
    <div className="relative bg-slate-100 rounded-xl p-4 min-h-[460px] flex flex-col">
      <p className="text-[10px] text-slate-400 mb-3 text-center uppercase tracking-wide">Widget preview</p>

      {/* Mock phone screen */}
      <div className="flex-1 flex items-end justify-end">
        {open && (
          <div className="w-full max-w-[280px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden ml-auto">
            {/* Header */}
            <div className="p-3 flex items-center gap-2.5" style={{ backgroundColor: brandColor }}>
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-contain bg-white p-0.5" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                  {clinicName?.[0] ?? "C"}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-xs">{clinicName || "Your Clinic"}</p>
                <p className="text-white/70 text-[10px]">Usually replies instantly</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto text-white/70 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Chat area */}
            <div className="p-3 bg-slate-50 space-y-2 min-h-[180px]">
              <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-slate-700 shadow-sm border border-slate-100 max-w-[85%]">
                Hi! 👋 I&apos;ll ask you a few quick questions to help the team prepare.
              </div>
              {firstQ && (
                <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-slate-700 shadow-sm border border-slate-100 max-w-[85%]">
                  {firstQ.questionText}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="p-3 bg-white border-t border-slate-100">
              {firstOptions.slice(0, 3).map(opt => (
                <div
                  key={opt}
                  className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg mb-1.5 text-slate-600 last:mb-0 cursor-default"
                >
                  {opt}
                </div>
              ))}
              {firstOptions.length > 3 && (
                <p className="text-[10px] text-slate-400 text-center mt-1">+{firstOptions.length - 3} more options</p>
              )}
              {!firstQ && (
                <p className="text-xs text-slate-400 text-center py-2">Add questions on the left</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Launcher */}
      <div className="flex justify-end mt-3">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105"
          style={{ backgroundColor: brandColor }}
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
