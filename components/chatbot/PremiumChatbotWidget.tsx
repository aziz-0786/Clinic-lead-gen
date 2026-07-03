"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight, Phone, MessageCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ANIM } from "@/lib/animation";

// ── Types ─────────────────────────────────────────────────────────────────────
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
  logoUrl?: string | null;
  phone: string;
}
interface Message {
  role: "bot" | "user";
  text: string;
}
type ChatStep = "contact" | "questions" | "submitting" | "done" | "error";

// ── Specialty-specific teaser bubble copy ──────────────────────────────────────
const TEASER: Record<string, string> = {
  Dental: "🦷 Tooth pain or just curious about your smile? I can help in under a minute.",
  "Skin/Cosmetic": "✨ Skin concern? Let me connect you with the right specialist quickly.",
  "Multi-Specialty": "🏥 Not sure which department you need? I'll figure it out for you.",
  "General Physician": "💊 Feeling under the weather? Tell me more and I'll get you seen fast.",
  Other: "👋 Have a health question? I can help direct you to the right care.",
};

// ── Urgency map ───────────────────────────────────────────────────────────────
const URGENCY_MAP: Record<string, string> = {
  "Emergency — need help today": "EMERGENCY_TODAY",
  "Urgent — something flared up": "EMERGENCY_TODAY",
  "This week": "THIS_WEEK",
  "This month": "THIS_MONTH",
  "Just exploring options": "JUST_EXPLORING",
};

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots({ color }: { color: string }) {
  return (
    <div className="flex justify-start">
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-stone-100">
        <span className="flex gap-1 items-end">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full animate-typing-bounce"
              style={{ backgroundColor: color, animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

// ── Completion animation ──────────────────────────────────────────────────────
function SuccessCheck({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <svg className="w-14 h-14 animate-confetti-pop" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="26" fill={color} opacity="0.12" />
        <circle cx="28" cy="28" r="20" fill={color} opacity="0.18" />
        <circle cx="28" cy="28" r="14" fill={color} />
        <path
          d="M19 28.5l6 6 12-13"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          className="animate-check-draw"
        />
      </svg>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, color }: { msg: Message; color: string }) {
  return (
    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up-fade`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          msg.role === "user"
            ? "text-white rounded-br-sm"
            : "bg-white text-stone-800 shadow-sm border border-stone-100 rounded-bl-sm"
        }`}
        style={msg.role === "user" ? { backgroundColor: color } : {}}
      >
        {msg.text}
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export function PremiumChatbotWidget({
  slug,
  business,
  questions,
}: {
  slug: string;
  business: Business;
  questions: Question[];
}) {
  const color = business.brandColor ?? "#0891b2";
  const totalSteps = questions.length;

  const [open, setOpen] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(0); // count of dismissals
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<ChatStep>("contact");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const teaser = TEASER[business.specialty] ?? TEASER["Other"];

  // Detect mobile
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 640); }
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-show teaser after 5s (once per session)
  useEffect(() => {
    if (teaserDismissed >= 2 || open) return;
    const delay = teaserDismissed === 0 ? 5000 : 0;
    const t = setTimeout(() => setShowTeaser(true), delay);
    return () => clearTimeout(t);
  }, [teaserDismissed, open]);

  // Re-show teaser once when "why-us" section is visible
  useEffect(() => {
    if (teaserDismissed !== 1 || open) return;
    const el = document.getElementById("why-us");
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShowTeaser(true); obs.disconnect(); }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [teaserDismissed, open]);

  function dismissTeaser() {
    setShowTeaser(false);
    setTeaserDismissed(n => n + 1);
  }

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Initialize chat on open
  useEffect(() => {
    if (!open || messages.length > 0) return;
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages([{
        role: "bot",
        text: `Hi! 👋 I'm the virtual assistant for ${business.name}. I'll ask you a couple of quick questions to help the team prepare for your visit.`,
      }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "bot", text: "First up — what's your name and phone number?" }]);
        setStep("contact");
      }, 600);
    }, 1200);
  }, [open]);

  function addBot(text: string, delay = 0) {
    if (delay) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, { role: "bot", text }]);
      }, delay);
    } else {
      setMessages(prev => [...prev, { role: "bot", text }]);
    }
  }

  function handleContactSubmit() {
    if (!contact.name.trim() || !contact.phone.trim()) return;
    setMessages(prev => [...prev, { role: "user", text: `${contact.name} · ${contact.phone}` }]);
    if (questions.length === 0) {
      doSubmit({});
    } else {
      setTimeout(() => {
        addBot(questions[0].questionText);
        setStep("questions");
        setCurrentQ(0);
      }, 500);
    }
  }

  function handleOptionSelect(option: string) {
    const newAnswers = { ...answers, [`q${currentQ + 1}`]: option };
    setAnswers(newAnswers);
    setMessages(prev => [...prev, { role: "user", text: option }]);
    const next = currentQ + 1;
    if (next < questions.length) {
      setCurrentQ(next);
      addBot(questions[next].questionText, 600);
    } else {
      doSubmit(newAnswers);
    }
  }

  async function doSubmit(finalAnswers: Record<string, string>) {
    setStep("submitting");
    setTyping(true);
    setTimeout(() => setTyping(false), 1200);

    const urgencyRaw = Object.values(finalAnswers).find(a => URGENCY_MAP[a]);
    const urgency = urgencyRaw ? URGENCY_MAP[urgencyRaw] : "THIS_MONTH";
    const concernType = finalAnswers["q1"] ?? "Other";
    const visitMode = Object.values(finalAnswers).find(a => a === "In-Clinic" || a === "Teleconsult") ?? "In-Clinic";
    const patientType = Object.values(finalAnswers).find(a => a === "New Patient" || a === "Returning Patient") ?? "New Patient";

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
        setDone(true);
        setStep("done");
        setTimeout(() => {
          addBot(`Thank you, ${contact.name.split(" ")[0]}! 🎉 Your inquiry has been received and the team at ${business.name} will be in touch shortly.`);
          if (data.lead?.intentLabel === "HIGH" || urgency === "EMERGENCY_TODAY") {
            setTimeout(() => addBot("⚡ Since this sounds urgent, the front desk will call you soon. You can also reach us directly below."), 1200);
          }
        }, 800);
      } else {
        setStep("error");
        addBot("I'm sorry — something went wrong saving your details. Please call us directly.", 600);
      }
    } catch {
      setStep("error");
      addBot("I'm sorry — something went wrong. Please call us directly.", 600);
    }
  }

  const currentOptions: string[] =
    step === "questions" && questions[currentQ]
      ? (() => { try { return JSON.parse(questions[currentQ].options ?? "[]"); } catch { return []; } })()
      : [];

  const progressPct = step === "done" ? 100 : totalSteps > 0 ? Math.round((currentQ / totalSteps) * 100) : 0;

  // Swipe-down to close on mobile
  function onTouchStart(e: React.TouchEvent) { setTouchStartY(e.touches[0].clientY); }
  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - touchStartY;
    if (delta > 80) setOpen(false);
  }

  function openChat() {
    setShowTeaser(false);
    setTeaserDismissed(2); // no more teaser after user opens chat
    setOpen(true);
  }

  return (
    <>
      {/* ── Teaser bubble ─────────────────────────────────────────── */}
      {showTeaser && !open && (
        <div className="fixed bottom-28 right-20 z-50 max-w-[240px] animate-bounce-in">
          <div className="relative bg-white rounded-2xl rounded-br-none shadow-xl border border-stone-100 px-4 py-3">
            <p className="text-sm text-stone-700 leading-snug">{teaser}</p>
            <button
              onClick={dismissTeaser}
              className="absolute -top-2 -right-2 w-5 h-5 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 text-xs"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {/* little tail pointing down-right toward the FAB */}
          <div className="absolute bottom-0 right-0 translate-x-0.5 translate-y-full w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-white" />
        </div>
      )}

      {/* ── FAB cluster ───────────────────────────────────────────── */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Secondary: Call — slides up after primary */}
        <a
          href={`tel:${business.phone}`}
          className="w-11 h-11 rounded-full bg-white shadow-lg border border-stone-100 flex items-center justify-center text-stone-600 hover:scale-110 active:scale-95"
          style={{
            animation: `fab-slide-up 0.3s ${ANIM.easing.spring} 0.12s both`,
            transition: `transform ${ANIM.duration.fast}ms ${ANIM.easing.standard}`,
          }}
          aria-label="Call clinic"
          title="Call us"
        >
          <Phone className="h-[18px] w-[18px]" />
        </a>

        {/* Primary: AI Chat with glow */}
        <div
          className="relative"
          style={{ animation: `fab-slide-up 0.3s ${ANIM.easing.spring} both` }}
        >
          {/* Glow ring */}
          <span
            className="absolute inset-0 rounded-full animate-glow-pulse"
            style={{ backgroundColor: color }}
          />
          <button
            onClick={openChat}
            aria-label="Open chat"
            className="relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-105 active:scale-95"
            style={{
              backgroundColor: color,
              transition: `transform ${ANIM.duration.fast}ms ${ANIM.easing.spring}`,
            }}
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* ── Chat panel ────────────────────────────────────────────── */}
      {open && (
        <>
          {/* Mobile backdrop */}
          {isMobile && (
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
          )}

          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className={`
              fixed z-50 bg-white flex flex-col overflow-hidden shadow-2xl
              animate-scale-in-spring
              ${isMobile
                ? "inset-x-0 bottom-0 rounded-t-3xl max-h-[92dvh]"
                : "bottom-24 right-6 w-[360px] max-h-[80vh] rounded-2xl border border-stone-100"
              }
            `}
            style={{ transformOrigin: isMobile ? "bottom center" : "bottom right" }}
          >
            {/* Drag handle (mobile only) */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-stone-200" />
              </div>
            )}

            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ backgroundColor: color }}>
              {business.logoUrl ? (
                <img src={business.logoUrl} alt="" className="w-9 h-9 rounded-full object-contain bg-white p-0.5" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  {business.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{business.name}</p>
                <p className="text-white/70 text-xs">AI assistant · usually instant</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress bar */}
            {step === "questions" && totalSteps > 0 && (
              <div className="relative h-1 bg-stone-100 shrink-0">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: color,
                    transition: `width ${ANIM.duration.slow}ms ${ANIM.easing.standard}`,
                  }}
                />
              </div>
            )}
            {step === "questions" && totalSteps > 0 && (
              <div className="px-4 pt-1.5 pb-0 shrink-0">
                <p className="text-[10px] text-stone-400 font-medium">
                  Question {currentQ + 1} of {totalSteps}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-stone-50">
              {messages.map((m, i) => <Bubble key={i} msg={m} color={color} />)}
              {typing && <TypingDots color={color} />}
              {done && <SuccessCheck color={color} />}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 bg-white border-t border-stone-100 shrink-0">
              {step === "contact" && (
                <div className="space-y-2">
                  <Input
                    placeholder="Your name *"
                    value={contact.name}
                    onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                    className="text-sm"
                    autoComplete="name"
                  />
                  <Input
                    placeholder="Phone number *"
                    value={contact.phone}
                    onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                    className="text-sm"
                    type="tel"
                    autoComplete="tel"
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={contact.email}
                    onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                    className="text-sm"
                    type="email"
                    autoComplete="email"
                  />
                  <button
                    onClick={handleContactSubmit}
                    disabled={!contact.name.trim() || !contact.phone.trim()}
                    className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: color }}
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {step === "questions" && currentOptions.length > 0 && (
                <div className="space-y-1.5">
                  {currentOptions.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => handleOptionSelect(opt)}
                      className="w-full text-left text-sm px-3 py-2.5 rounded-xl border border-stone-200 text-stone-700 transition-all hover:text-white active:scale-[0.98]"
                      onMouseEnter={e => {
                        const el = e.currentTarget;
                        el.style.backgroundColor = color;
                        el.style.borderColor = color;
                        el.style.color = "white";
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget;
                        el.style.backgroundColor = "";
                        el.style.borderColor = "";
                        el.style.color = "";
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {step === "done" && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-stone-500">
                  <Check className="h-4 w-4 text-green-500" />
                  Inquiry received — we'll be in touch soon.
                </div>
              )}

              {step === "error" && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center justify-center gap-2 py-2 text-sm font-medium"
                  style={{ color }}
                >
                  <Phone className="h-4 w-4" /> Call {business.phone}
                </a>
              )}

              {step === "submitting" && (
                <p className="text-center text-xs text-stone-400 py-2">Saving your inquiry…</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
