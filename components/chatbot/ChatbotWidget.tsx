"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ChevronRight, CheckCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Question {
  id: string;
  order: number;
  questionText: string;
  type: string;
  options: string | null;
  mapsToIntentWeight: number;
}

interface Business {
  id: string;
  name: string;
  ownerName: string;
  specialty: string;
  brandColor: string;
}

type ChatStep = "greeting" | "questions" | "contact" | "done" | "error";

interface Message {
  role: "bot" | "user";
  text: string;
}

export function ChatbotWidget({ slug, business: initialBusiness, questions: initialQuestions }: {
  slug: string;
  business: Business;
  questions: Question[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ChatStep>("greeting");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const brandColor = initialBusiness.brandColor ?? "#0891b2";

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "bot", text: `Hi! 👋 I'm the virtual assistant for ${initialBusiness.name}. I'll ask you a few quick questions to help the team prepare for your visit.` }]);
      setTimeout(() => {
        addBot("To get started, what's your name?");
        setStep("contact");
      }, 800);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function addBot(text: string) {
    setMessages(prev => [...prev, { role: "bot", text }]);
  }
  function addUser(text: string) {
    setMessages(prev => [...prev, { role: "user", text }]);
  }

  function handleContactSubmit() {
    if (!contact.name.trim() || !contact.phone.trim()) return;
    addUser(`${contact.name} — ${contact.phone}`);
    setTimeout(() => {
      if (initialQuestions.length === 0) {
        submitLead();
      } else {
        addBot(initialQuestions[0].questionText);
        setStep("questions");
      }
    }, 400);
  }

  function handleOptionSelect(option: string) {
    const q = initialQuestions[currentQ];
    addUser(option);
    const newAnswers = { ...answers, [`q${currentQ + 1}`]: option };
    setAnswers(newAnswers);
    const next = currentQ + 1;
    if (next < initialQuestions.length) {
      setTimeout(() => {
        addBot(initialQuestions[next].questionText);
        setCurrentQ(next);
      }, 400);
    } else {
      setTimeout(() => submitLead(newAnswers), 400);
    }
  }

  async function submitLead(finalAnswers = answers) {
    setLoading(true);
    addBot("Perfect! Give me a moment to save your inquiry… ⏳");

    // Map answer text to urgency enum
    const urgencyMap: Record<string, string> = {
      "Emergency — need help today": "EMERGENCY_TODAY",
      "Urgent — something flared up": "EMERGENCY_TODAY",
      "This week": "THIS_WEEK",
      "This month": "THIS_MONTH",
      "Just exploring options": "JUST_EXPLORING",
    };
    const urgencyRaw = Object.values(finalAnswers).find(a => urgencyMap[a]);
    const urgency = urgencyRaw ? urgencyMap[urgencyRaw] : "THIS_MONTH";
    const concernType = finalAnswers["q1"] ?? "Other";
    const visitMode = Object.values(finalAnswers).find(a => a === "In-Clinic" || a === "Teleconsult") ?? "In-Clinic";
    const patientTypeRaw = Object.values(finalAnswers).find(a => a === "New Patient" || a === "Returning Patient");
    const patientType = patientTypeRaw ?? "New Patient";

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: slug, name: contact.name, phone: contact.phone,
          email: contact.email || undefined, concernType, urgency, visitMode, patientType,
          answers: finalAnswers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("done");
        setSubmitted(true);
        addBot(`✅ Thank you, ${contact.name.split(' ')[0]}! Your inquiry has been received. The team at ${initialBusiness.name} will get back to you shortly.`);
        if (data.lead?.intentLabel === "HIGH" || urgency === "EMERGENCY_TODAY") {
          setTimeout(() => addBot("⚡ Since this looks urgent, the front desk will contact you soon. You can also call us directly."), 800);
        }
      } else {
        setStep("error");
        addBot("Sorry, something went wrong. Please call us directly.");
      }
    } catch {
      setStep("error");
      addBot("Sorry, something went wrong. Please call us directly.");
    }
    setLoading(false);
  }

  const currentOptions = step === "questions" && initialQuestions[currentQ]
    ? (() => { try { return JSON.parse(initialQuestions[currentQ].options ?? "[]"); } catch { return []; } })()
    : [];

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: brandColor }}
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden" style={{ maxHeight: "80vh" }}>
          {/* Header */}
          <div className="p-4 text-white flex items-center gap-3" style={{ backgroundColor: brandColor }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {initialBusiness.name[0]}
            </div>
            <div>
              <p className="font-semibold text-sm">{initialBusiness.name}</p>
              <p className="text-xs opacity-80">Usually replies instantly</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm"
                  }`}
                  style={m.role === "user" ? { backgroundColor: brandColor } : {}}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="p-3 bg-white border-t border-slate-100">
            {step === "contact" && (
              <div className="space-y-2">
                <Input placeholder="Your name *" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} className="text-sm" />
                <Input placeholder="Phone number *" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} className="text-sm" type="tel" />
                <Input placeholder="Email (optional)" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} className="text-sm" type="email" />
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: brandColor }}
                  onClick={handleContactSubmit}
                  disabled={!contact.name.trim() || !contact.phone.trim()}
                >
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === "questions" && currentOptions.length > 0 && (
              <div className="grid grid-cols-1 gap-1.5">
                {currentOptions.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className="text-left text-sm px-3 py-2 rounded-lg border border-slate-200 hover:border-current hover:text-white transition-colors"
                    style={{ '--hover-bg': brandColor } as React.CSSProperties}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = brandColor; (e.currentTarget as HTMLElement).style.borderColor = brandColor; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.color = ''; }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {step === "done" && (
              <div className="text-center py-2 text-sm text-slate-500 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Inquiry submitted successfully
              </div>
            )}

            {step === "error" && (
              <a href={`tel:+91`} className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4" /> Call us directly
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
