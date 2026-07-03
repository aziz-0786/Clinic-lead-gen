"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ANIM } from "@/lib/animation";

interface Testimonial {
  quote: string;
  name: string;
  label: string;
  initials: string;
  photo?: string; // optional — drop /public/images/patient-*.jpg to populate
}

const TESTIMONIALS: Record<string, Testimonial[]> = {
  Dental: [
    { quote: "I was terrified of dentists for years. The team here made my root canal completely painless — I couldn't believe it. I'll never go anywhere else.", name: "Ananya Sharma", label: "Regular Patient", initials: "AS", photo: "/images/patient-ananya.png" },
    { quote: "The smile transformation I got from the implants is beyond what I imagined. People keep asking if I've 'done something' — I just smile wider.", name: "Ramesh Iyer", label: "Implant Patient", initials: "RI", photo: "/images/patient-ramesh.png" },
    { quote: "My children actually look forward to their check-ups here. The staff is so warm with kids. That's rare to find.", name: "Priya Mehta", label: "Parent & Patient", initials: "PM", photo: "/images/patient-priya.png" },
  ],
  "Skin/Cosmetic": [
    { quote: "Six months of treatment and my skin is unrecognisable. The team understood my skin type and never over-promised. Genuine results.", name: "Kavya Nair", label: "Acne Treatment", initials: "KN" },
    { quote: "The laser sessions were professional, comfortable, and incredibly effective. I only wish I'd found this clinic sooner.", name: "Sunita Rao", label: "Laser Patient", initials: "SR" },
    { quote: "The consultation alone was worth it — detailed, honest, no pressure. They told me what I actually needed, not what's most expensive.", name: "Deepa Krishnan", label: "Cosmetic Consult", initials: "DK" },
  ],
  "Multi-Specialty": [
    { quote: "Having all specialists under one roof saved me so much time. Referrals happened the same day, and the coordination between departments is excellent.", name: "Suresh Kumar", label: "Cardiology Patient", initials: "SK" },
    { quote: "Brought my mother for orthopaedic care and was blown away by the attentiveness. The doctor spent 40 minutes with her, not 5.", name: "Meena Joshi", label: "Family Patient", initials: "MJ" },
    { quote: "Managing my diabetes here has been completely different — they treat the whole person, not just the numbers. My readings have never been better.", name: "Arjun Patel", label: "Diabetes Management", initials: "AP" },
  ],
  "General Physician": [
    { quote: "Finally a GP who listens. Didn't rush through the appointment, asked real questions, and explained everything clearly. Exactly what I needed.", name: "Pooja Desai", label: "Regular Patient", initials: "PD" },
    { quote: "Brought my whole family here for annual check-ups — the preventive care advice was practical and actually useful.", name: "Vijay Gupta", label: "Family Patient", initials: "VG" },
    { quote: "Same-day appointment for a high fever. Diagnosed, treated, and on the mend within hours. This team genuinely cares.", name: "Ritu Sinha", label: "Emergency Patient", initials: "RS" },
  ],
};

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { quote: "Exceptional care and a team that truly listens. I've recommended this clinic to everyone I know.", name: "Rohit Agarwal", label: "Happy Patient", initials: "RA" },
  { quote: "Professional, warm, and thorough. The consultation changed how I think about my health.", name: "Shruti Verma", label: "Happy Patient", initials: "SV" },
  { quote: "The best healthcare experience I've had in years. Zero waiting time and genuine expertise.", name: "Anil Sharma", label: "Happy Patient", initials: "AN" },
];

export function TestimonialsCarousel({ specialty, color }: { specialty: string; color: string }) {
  const items = TESTIMONIALS[specialty] ?? DEFAULT_TESTIMONIALS;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Touch/swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % items.length);
    }, 5500);
  }, [items.length]);

  useEffect(() => {
    if (!paused) startTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, startTimer]);

  function prev() {
    setCurrent(c => (c - 1 + items.length) % items.length);
    if (!paused) startTimer(); // reset timer
  }

  function next() {
    setCurrent(c => (c + 1) % items.length);
    if (!paused) startTimer();
  }

  // Touch handlers for swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only track horizontal swipes
    if (Math.abs(dx) > Math.abs(dy)) {
      setDragOffset(dx);
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    setDragOffset(0);

    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  }

  const t = items[current];

  return (
    <div
      className="relative max-w-2xl mx-auto text-center px-4 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Large decorative quote mark */}
      <svg
        className="w-12 h-12 mx-auto mb-6 opacity-15"
        style={{ color }}
        viewBox="0 0 48 48"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M14 8C8.477 8 4 12.477 4 18v4c0 5.523 4.477 10 10 10h2v8H4v-8a18 18 0 010-18V8h10zm22 0c-5.523 0-10 4.477-10 10v4c0 5.523 4.477 10 10 10h2v8H26v-8a18 18 0 010-18V8h10z" />
      </svg>

      {/* Quote — fades when changing */}
      <blockquote
        key={current}
        className="text-stone-700 text-lg md:text-xl leading-relaxed font-light italic mb-8 animate-fade-up"
        style={{
          transform: dragOffset !== 0 ? `translateX(${dragOffset * 0.15}px)` : undefined,
          transition: dragOffset !== 0 ? "none" : `transform 0.3s ${ANIM.easing.standard}`,
        }}
      >
        "{t.quote}"
      </blockquote>

      <div className="flex items-center justify-center gap-3">
        {/* Avatar: real photo if provided, initials fallback */}
        <div
          className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-offset-2 ring-white/30"
          style={{ backgroundColor: color }}
        >
          {t.photo ? (
            <img
              src={t.photo}
              alt={t.name}
              className="w-full h-full object-cover object-top transition-opacity duration-500"
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
          ) : t.initials}
        </div>
        <div className="text-left">
          <p className="font-semibold text-stone-900 text-sm">{t.name}</p>
          <p className="text-xs text-stone-400">{t.label}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={prev}
          aria-label="Previous testimonial"
          className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-400 hover:text-stone-700 transition-colors active:scale-95"
          style={{ transition: `all ${ANIM.duration.base}ms ${ANIM.easing.standard}` }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Dot pagination with scale/fill hover */}
        <div className="flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); if (!paused) startTimer(); }}
              aria-label={`Go to testimonial ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === current ? "20px" : "8px",
                height: "8px",
                backgroundColor: i === current ? color : "#d6d3d1",
                transform: i === current ? "scale(1)" : undefined,
                transition: `all ${ANIM.duration.base}ms ${ANIM.easing.standard}`,
              }}
              onMouseEnter={e => {
                if (i !== current) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.3)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          aria-label="Next testimonial"
          className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-400 hover:text-stone-700 transition-colors active:scale-95"
          style={{ transition: `all ${ANIM.duration.base}ms ${ANIM.easing.standard}` }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Auto-rotation paused indicator (desktop) */}
      {paused && (
        <p className="mt-3 text-[10px] text-stone-300 tracking-wide hidden md:block">auto-rotation paused</p>
      )}
    </div>
  );
}
