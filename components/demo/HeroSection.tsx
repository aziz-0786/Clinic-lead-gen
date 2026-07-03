"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Sparkles, MapPin, Phone, Clock, MessageCircle, Star,
} from "lucide-react";
import { DuotoneHeading } from "./DuotoneHeading";
import { KickerTag } from "./KickerTag";
import { ANIM } from "@/lib/animation";

interface HeroSectionProps {
  clinicName: string;
  city: string;
  phone: string;
  color: string;
  tagline: string;
  subline: string;
  specialtyLabel: string;
}

// ── Video eligibility check (runs client-side only) ───────────────────────────
function checkVideoEligibility(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && ["slow-2g", "2g"].includes(conn.effectiveType)) return false;
  return true;
}

// ── Main component ────────────────────────────────────────────────────────────
export function HeroSection({
  clinicName, city, phone, color, tagline, subline, specialtyLabel,
}: HeroSectionProps) {
  const sectionRef    = useRef<HTMLElement>(null);
  const videoBgRef    = useRef<HTMLDivElement>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const crossfadeRef  = useRef<HTMLDivElement>(null);
  const heroImgRef    = useRef<HTMLImageElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Cached images skip onLoad — check complete after mount
  useLayoutEffect(() => {
    if (heroImgRef.current?.complete) {
      heroImgRef.current.style.opacity = "1";
    }
  }, []);

  // Determine if video should play (evaluated client-side only)
  const [showVideo, setShowVideo] = useState<boolean | null>(null);
  useEffect(() => { setShowVideo(checkVideoEligibility()); }, []);

  // Lazy-start: only call play() once the hero is in viewport
  useEffect(() => {
    if (!showVideo) return;
    const section = sectionRef.current;
    const video   = videoRef.current;
    if (!section || !video) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) video.play().catch(() => {}); else video.pause(); },
      { threshold: 0.05 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, [showVideo]);

  // Crossfade overlay just before the native loop restarts
  useEffect(() => {
    if (!showVideo) return;
    const video   = videoRef.current;
    const overlay = crossfadeRef.current;
    if (!video || !overlay) return;
    let fading = false;
    function onTimeUpdate() {
      if (!video!.duration || fading) return;
      if (video!.duration - video!.currentTime <= 1.0) {
        fading = true;
        overlay!.style.opacity = "1";
        setTimeout(() => { overlay!.style.opacity = "0"; fading = false; }, 700);
      }
    }
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [showVideo]);

  // Parallax: video bg scrolls at 30% of page scroll speed (desktop only)
  useEffect(() => {
    if (!showVideo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const el      = videoBgRef.current;
          const section = sectionRef.current;
          if (el && section) {
            const sectionTop = section.getBoundingClientRect().top;
            const scrolled   = -sectionTop;
            if (scrolled > -window.innerHeight && scrolled < section.offsetHeight) {
              el.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showVideo]);

  // Hero content reveal on mount
  const [contentVisible, setContentVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setContentVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const taglineParts = tagline.split(",");
  const lead = taglineParts[0]?.trim() ?? clinicName;
  const fade = taglineParts[1]?.trim() ?? specialtyLabel;

  // Shared button transition class (no JS needed — pure CSS is smoother)
  const btnTransition = `transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]`;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden"
      aria-label="Hero"
    >
      {/* ── Video background ──────────────────────────────────────────────── */}
      {showVideo && (
        <div ref={videoBgRef} className="hero-video-bg" aria-hidden="true">
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
            className={`transition-opacity duration-700 ${videoReady ? "opacity-100" : "opacity-0"}`}
          >
            <source src="/vid.mp4" type="video/mp4" />
          </video>
          {/* Loop crossfade overlay */}
          <div
            ref={crossfadeRef}
            className="absolute inset-0 bg-stone-950 opacity-0 pointer-events-none"
            style={{ transition: `opacity 0.6s ${ANIM.easing.standard}` }}
          />
        </div>
      )}

      {/* Gradient overlay — lighter when video plays, strong when no video */}
      <div
        className="absolute inset-0"
        style={{
          background: showVideo
            ? "linear-gradient(to bottom right, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.58) 55%, rgba(0,0,0,0.7) 100%)"
            : `linear-gradient(135deg, ${color}f0 0%, #1c1917ee 60%, #000000dd 100%)`,
        }}
      />
      {/* Subtle brand-colour tint only when video plays */}
      {showVideo && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: `${color}28` }}
        />
      )}

      {/* Decorative radial glow */}
      <div
        className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      {/* ── Foreground content ───────────────────────────────────────────── */}
      <div
        className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-20 flex flex-col md:flex-row items-center gap-12"
        style={{
          opacity:   contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(20px)",
          transition: `opacity 0.6s ${ANIM.easing.standard}, transform 0.6s ${ANIM.easing.standard}`,
        }}
      >
        {/* Left: copy */}
        <div className="flex-1">
          <KickerTag
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label={specialtyLabel}
            color={color}
            className="opacity-90"
          />

          <DuotoneHeading lead={lead} fade={fade} as="h1" onDark className="mt-4" />

          <p className="mt-5 text-white/70 text-lg leading-relaxed max-w-xl">
            {subline}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <span className="flex items-center gap-1.5 text-white/60 text-sm">
              <MapPin className="h-3.5 w-3.5" />{city}
            </span>
            <span className="text-white/30">·</span>
            <span className="flex items-center gap-1.5 text-white/60 text-sm">
              <Phone className="h-3.5 w-3.5" />{phone}
            </span>
            <span className="text-white/30">·</span>
            <span className="flex items-center gap-1.5 text-white/60 text-sm">
              <Clock className="h-3.5 w-3.5" />Mon–Sat · 9 AM – 7 PM
            </span>
          </div>

          {/* Hero CTAs — smooth CSS hover, no JS movement */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            {/* Primary CTA */}
            <div
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold shadow-lg cursor-default select-none ${btnTransition} hover:-translate-y-1 hover:shadow-2xl active:scale-[0.97] active:translate-y-0`}
              style={{ backgroundColor: color }}
            >
              <MessageCircle className="h-4 w-4" />
              Chat with us — takes 2 mins
            </div>
            {/* Secondary CTA */}
            <a
              href={`tel:${phone}`}
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/25 text-white font-semibold ${btnTransition} hover:-translate-y-1 hover:bg-white/12 hover:border-white/40 active:scale-[0.97] active:translate-y-0`}
            >
              <Phone className="h-4 w-4" />
              Call directly
            </a>
          </div>

          {/* Social proof strip */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["AS", "RP", "KN", "MJ"].map(i => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: `${color}aa` }}
                >
                  {i}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-white/50 text-xs mt-0.5">Trusted by 10,000+ patients</p>
            </div>
          </div>
        </div>

        {/* Right: hero image + at-a-glance card (desktop only) */}
        <div className="hidden lg:flex flex-col flex-shrink-0 w-72 gap-4">
          {/* IMAGE SLOT 1 — hero-doctor.png (landscape 2752×1536, ratio ~16:9) */}
          <div
            className="group relative rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/15"
            style={{ aspectRatio: "16/9" }}
          >
            <img
              ref={heroImgRef}
              src="/images/hero-doctor.png"
              alt="Professional dental care"
              className="w-full h-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] opacity-0"
              onLoad={e => { e.currentTarget.style.opacity = "1"; }}
            />
          </div>

          {/* At a glance card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-6 text-white space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/50">At a glance</p>
            {[
              { label: "Next available", value: "Today" },
              { label: "Avg. wait",       value: "< 15 min" },
              { label: "Consult fee",     value: "₹300–₹800" },
              { label: "Languages",       value: "Hindi · English" },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-baseline">
                <span className="text-white/50 text-sm">{row.label}</span>
                <span className="text-white font-semibold text-sm">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  );
}
