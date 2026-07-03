import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PremiumChatbotWidget } from "@/components/chatbot/PremiumChatbotWidget";
import { DemoNav } from "@/components/demo/DemoNav";
import { StatBand } from "@/components/demo/StatBand";
import { DuotoneHeading } from "@/components/demo/DuotoneHeading";
import { KickerTag } from "@/components/demo/KickerTag";
import { TestimonialsCarousel } from "@/components/demo/TestimonialsCarousel";
import { HeroSection } from "@/components/demo/HeroSection";
import { DemoAnimations } from "@/components/demo/DemoAnimations";
import { FadeImage } from "@/components/demo/FadeImage";
import {
  Shield, Clock, Star, Phone, MapPin, CheckCircle2,
  Stethoscope, ClipboardList, CalendarCheck, HeartHandshake,
  Sparkles, MessageCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ── Specialty-specific data maps ──────────────────────────────────────────────
const SPECIALTY_LABEL: Record<string, string> = {
  Dental: "Dental Care",
  "Skin/Cosmetic": "Skin & Cosmetic",
  "Multi-Specialty": "Multi-Specialty",
  "General Physician": "General Medicine",
  Other: "Healthcare",
};

const HERO_TAGLINE: Record<string, string> = {
  Dental: "Brighter Smiles, Healthier Lives",
  "Skin/Cosmetic": "Confidence Starts With Healthy Skin",
  "Multi-Specialty": "Complete Care Under One Roof",
  "General Physician": "Your Health, Our Priority",
  Other: "Exceptional Care, Every Time",
};

const HERO_SUBLINE: Record<string, string> = {
  Dental: "Advanced dental solutions delivered with warmth and precision — from routine check-ups to full-smile transformations.",
  "Skin/Cosmetic": "Personalised skin treatments backed by science, delivered by dermatologists who understand your unique skin.",
  "Multi-Specialty": "A full spectrum of specialist care — all coordinated in one place so you spend less time navigating and more time healing.",
  "General Physician": "Compassionate, comprehensive family medicine — from acute illness to long-term wellness management.",
  Other: "Expert healthcare built around you — prompt, personal, and professional.",
};

const SERVICES: Record<string, { icon: string; name: string; desc: string }[]> = {
  Dental: [
    { icon: "🦷", name: "Root Canal Treatment", desc: "Painless procedure to save damaged teeth with modern anaesthesia." },
    { icon: "✨", name: "Teeth Whitening", desc: "Professional-grade whitening — up to 8 shades lighter in one visit." },
    { icon: "🔩", name: "Dental Implants", desc: "Permanent, natural-looking replacements anchored in the jaw." },
    { icon: "😁", name: "Invisible Aligners", desc: "Straighten teeth discreetly — no wires, no brackets." },
    { icon: "🩹", name: "Gum Treatment", desc: "Deep cleaning and periodontal therapy to protect your foundation." },
    { icon: "💎", name: "Cosmetic Dentistry", desc: "Veneers, bonding, and smile makeovers tailored to your face." },
  ],
  "Skin/Cosmetic": [
    { icon: "🌿", name: "Acne Treatment", desc: "Evidence-based protocols to clear active breakouts and scars." },
    { icon: "🌟", name: "Laser Hair Removal", desc: "Long-lasting smoothness across all skin tones." },
    { icon: "🧪", name: "Chemical Peels", desc: "Resurfacing treatments for texture, pigmentation, and glow." },
    { icon: "⏳", name: "Anti-Aging", desc: "Fillers, Botox alternatives, and RF treatments for youthful skin." },
    { icon: "💆", name: "Hair Fall Treatment", desc: "PRP, mesotherapy, and nutritional protocols for scalp health." },
    { icon: "☀️", name: "Skin Brightening", desc: "Glutathione drips, tranexamic protocols, and vitamin infusions." },
  ],
  "Multi-Specialty": [
    { icon: "💊", name: "General Medicine", desc: "Fever, infections, and acute care available same day." },
    { icon: "🦴", name: "Orthopaedics", desc: "Joint, bone, and sports injury management with physio support." },
    { icon: "👶", name: "Paediatrics", desc: "Child health from newborn to adolescence — vaccinations included." },
    { icon: "❤️", name: "Cardiology", desc: "ECG, echocardiography, and preventive cardiac care." },
    { icon: "👂", name: "ENT", desc: "Ear, nose, and throat conditions treated surgically and medically." },
    { icon: "🩺", name: "Gynaecology", desc: "Women's health across all life stages, handled with discretion." },
  ],
  "General Physician": [
    { icon: "🤒", name: "Fever & Infections", desc: "Rapid diagnosis and treatment for viral and bacterial illness." },
    { icon: "🩸", name: "Diabetes Management", desc: "Long-term HbA1c control with lifestyle and medication guidance." },
    { icon: "📊", name: "Blood Pressure Care", desc: "Hypertension monitoring, medication, and dietary coaching." },
    { icon: "🛡️", name: "Preventive Health", desc: "Annual wellness checks and early detection screenings." },
    { icon: "💉", name: "Vaccinations", desc: "Adult and travel immunisations for complete protection." },
    { icon: "📋", name: "Follow-up Care", desc: "Continuity of care post-hospitalisation or specialist visits." },
  ],
  Other: [
    { icon: "🩺", name: "Consultation", desc: "Expert medical opinion tailored to your presenting concern." },
    { icon: "🔬", name: "Diagnostics", desc: "In-house and coordinated diagnostic tests for fast results." },
    { icon: "💊", name: "Treatment", desc: "Evidence-based medical and procedural therapies." },
    { icon: "📞", name: "Follow-up", desc: "Structured follow-up to monitor recovery and outcomes." },
    { icon: "🛡️", name: "Preventive Care", desc: "Proactive health screening and lifestyle guidance." },
    { icon: "🏥", name: "Health Checkup", desc: "Comprehensive wellness packages for all age groups." },
  ],
};

const WHY_CHECKLIST: Record<string, string[]> = {
  Dental: ["NABH-accredited sterilisation protocols", "Digital X-rays — 90% less radiation", "Sedation dentistry available", "Smile design preview before treatment", "Flexible EMI payment plans"],
  "Skin/Cosmetic": ["Board-certified dermatologist on site", "FDA-approved equipment only", "Patch-test mandatory before treatment", "Custom skin analysis included in every consultation", "Post-treatment follow-up at no extra charge"],
  "Multi-Specialty": ["20+ specialists under one roof", "In-house diagnostic lab with 4-hour reports", "Ambulance-ready emergency team", "Direct specialist referrals — no GP gatekeeping", "Insurance & cashless tie-ups available"],
  "General Physician": ["Same-day appointments for fever & acute care", "Electronic health records — complete history one tap away", "Home visit available within 5 km", "WhatsApp follow-up for ongoing conditions", "Senior citizen priority queue"],
  Other: ["Evidence-based protocols only", "Patient data fully secure & private", "Bilingual consultations available", "Transparent pricing — no hidden charges", "Dedicated care coordinator for complex cases"],
};

const JOURNEY_STEPS: { icon: typeof Stethoscope; label: string; desc: string }[] = [
  { icon: MessageCircle, label: "Quick Inquiry", desc: "Chat with our AI assistant — takes under 2 minutes. No paperwork, no waiting." },
  { icon: CalendarCheck, label: "Confirmed Booking", desc: "The front desk calls you to confirm a slot that works for your schedule." },
  { icon: Stethoscope, label: "Your Consultation", desc: "Meet the doctor, get a thorough examination, and a clear treatment plan." },
  { icon: HeartHandshake, label: "Ongoing Care", desc: "Follow-up, questions, and monitoring — we're with you well beyond the appointment." },
];

export default async function DemoPage({ params }: { params: { businessSlug: string } }) {
  const business = await prisma.business.findUnique({
    where: { slug: params.businessSlug },
    select: {
      id: true, slug: true, name: true, ownerName: true, specialty: true,
      brandColor: true, logoUrl: true, city: true, phone: true, tier: true,
    },
  });
  if (!business) notFound();

  const questions = await prisma.chatbotQuestion.findMany({
    where: { businessId: business.id },
    orderBy: { order: "asc" },
  });

  const sp = business.specialty;
  const color = business.brandColor || "#0891b2";
  const serviceList = SERVICES[sp] ?? SERVICES["Other"];
  const checklist = WHY_CHECKLIST[sp] ?? WHY_CHECKLIST["Other"];
  const specialtyLabel = SPECIALTY_LABEL[sp] ?? "Healthcare";

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(business.name + " " + business.city)}&output=embed`;

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans">
      {/* ── Fixed nav ───────────────────────────────────────────────────── */}
      <DemoNav
        clinicName={business.name}
        logoUrl={business.logoUrl ?? null}
        color={color}
        phone={business.phone}
      />

      {/* ── 1. Hero (client component — video + parallax + magnetic CTAs) ── */}
      <HeroSection
        clinicName={business.name}
        city={business.city}
        phone={business.phone}
        color={color}
        tagline={HERO_TAGLINE[sp] ?? business.name}
        subline={HERO_SUBLINE[sp] ?? HERO_SUBLINE["Other"]}
        specialtyLabel={specialtyLabel}
      />

      {/* ── 2. StatBand ─────────────────────────────────────────────────── */}
      <StatBand color={color} />

      {/* ── 3. Services ─────────────────────────────────────────────────── */}
      <section id="services" className="py-20 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10" data-reveal>
            <KickerTag icon={<ClipboardList className="h-3.5 w-3.5" />} label="What We Treat" color={color} />
            <DuotoneHeading lead="Our" fade={`${specialtyLabel} Services`} as="h2" />
            <p className="text-stone-500 max-w-xl mx-auto mt-3">
              We use the latest technology to deliver personalised, compassionate care — from your first visit to long-term wellness.
            </p>
          </div>

          {/* IMAGE SLOT 2 — services-banner.png (landscape 2752×1536, ~16:9) */}
          <div
            data-reveal
            className="group relative rounded-2xl overflow-hidden mb-8 bg-stone-200"
            style={{ transitionDelay: "0.1s", aspectRatio: "21/7" /* cinematic wide crop */ }}
          >
            <FadeImage
              src="/images/services-banner.png"
              alt="Our dental services"
              loading="eager"
              className="w-full h-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
            />
            {/* Cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/45 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Stagger grid — each card gets data-reveal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-stagger>
            {serviceList.map(svc => (
              <div
                key={svc.name}
                data-reveal
                data-tap
                className="service-card group bg-white rounded-2xl p-6 border border-stone-100 hover:border-transparent"
              >
                <div
                  className="service-card-icon w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ backgroundColor: `${color}18` }}
                >
                  {svc.icon}
                </div>
                <h3 className="font-semibold text-stone-900 mb-1.5">{svc.name}</h3>
                <p className="text-sm text-stone-500 leading-relaxed mb-3">{svc.desc}</p>
                <span className="service-card-arrow inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
                  Learn more →
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Why Choose Us ────────────────────────────────────────────── */}
      <section id="why-us" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            {/* Left: image + checklist */}
            <div data-reveal>
              <KickerTag icon={<Shield className="h-3.5 w-3.5" />} label="Why Choose Us" color={color} />
              <DuotoneHeading lead="The Difference" fade="You'll Feel" as="h2" />
              <p className="text-stone-500 mt-3 mb-6 leading-relaxed">
                We don't just treat conditions — we build long-term relationships with patients who trust us with their health.
              </p>

              {/*
                IMAGE SLOT 3 — why-us-clinic.png (portrait 1536×2752)
                Taller container + object-top to focus on the upper subject area.
              */}
              <div className="group relative rounded-2xl overflow-hidden mb-8 h-80 sm:h-96 bg-stone-100">
                <FadeImage
                  src="/images/why-us-clinic.png"
                  alt="Our modern clinic"
                  className="w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  style={{ objectPosition: "center 22%" }}
                />
              </div>

              <ul className="space-y-4">
                {checklist.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <CheckCircle2
                      className="h-5 w-5 shrink-0 mt-0.5"
                      style={{ color }}
                    />
                    <span className="text-stone-700 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: 3 numbered cards — stagger + numeral leading scale */}
            <div className="space-y-5" data-stagger-numcards>
              {[
                { n: "01", title: "Certified & Experienced", desc: "Our doctors hold advanced certifications and bring years of specialised practice to every case." },
                { n: "02", title: "Same-Day Appointments", desc: "Urgent or emergency visits accommodated as early as today — just send us a message." },
                { n: "03", title: "Personalised Treatment", desc: "No one-size-fits-all. Every plan is built around your specific needs, lifestyle, and goals." },
              ].map(card => (
                <div
                  key={card.n}
                  data-reveal-numcard
                  data-tap
                  className="num-card flex gap-4 p-5 rounded-2xl border border-stone-100"
                  style={{
                    opacity: 0,
                    transform: "translateY(24px)",
                    transition: "opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div
                    data-numeral
                    className="text-2xl font-black shrink-0 leading-none"
                    style={{ color: `${color}40` }}
                  >
                    {card.n}
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-1">{card.title}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Patient Journey ──────────────────────────────────────────── */}
      <section id="journey" className="py-20" style={{ backgroundColor: `${color}08` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14" data-reveal>
            <KickerTag icon={<HeartHandshake className="h-3.5 w-3.5" />} label="How It Works" color={color} />
            <DuotoneHeading lead="From Inquiry" fade="to Ongoing Care" as="h2" />
            <p className="text-stone-500 max-w-xl mx-auto mt-3">
              Getting the care you need shouldn't be complicated. Here's what to expect:
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Connector line (desktop) — draws left-to-right on scroll */}
            <div
              data-timeline-line
              className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-0.5"
              style={{ backgroundColor: `${color}30` }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-stagger>
              {JOURNEY_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={i}
                    data-reveal
                    data-tap
                    className="relative flex flex-col items-center text-center"
                  >
                    {/* Circle */}
                    <div
                      className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="h-8 w-8 text-white" />
                      {/* Step number badge */}
                      <span
                        className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full text-xs font-black flex items-center justify-center shadow"
                        style={{ color }}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-stone-900 mb-2">{step.label}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Testimonials ─────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12" data-reveal>
            <KickerTag icon={<Star className="h-3.5 w-3.5" />} label="Patient Stories" color={color} />
            <DuotoneHeading lead="What Our" fade="Patients Say" as="h2" />
          </div>
          <TestimonialsCarousel specialty={sp} color={color} />
        </div>
      </section>

      {/* ── 7. Contact ──────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12" data-reveal>
            <KickerTag icon={<MapPin className="h-3.5 w-3.5" />} label="Find Us" color={color} />
            <DuotoneHeading lead="Visit" fade="Our Clinic" as="h2" />
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Map embed */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-100 h-72 lg:h-[380px]" data-reveal>
              <iframe
                src={mapSrc}
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map to ${business.name}`}
              />
            </div>

            {/* Details */}
            <div className="space-y-5" data-reveal>
              {[
                {
                  icon: <MapPin className="h-5 w-5" />,
                  label: "Location",
                  value: `${business.name}, ${business.city}`,
                  sub: "See map for directions →",
                },
                {
                  icon: <Phone className="h-5 w-5" />,
                  label: "Phone",
                  value: business.phone,
                  sub: "Available Mon–Sat, 9 AM – 7 PM",
                  href: `tel:${business.phone}`,
                },
                {
                  icon: <Clock className="h-5 w-5" />,
                  label: "Hours",
                  value: "Monday – Saturday",
                  sub: "9:00 AM – 7:00 PM · Sunday: Emergency only",
                },
              ].map(row => (
                <div key={row.label} className="flex gap-4 p-5 bg-white rounded-2xl border border-stone-100">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {row.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-400">{row.label}</p>
                    {row.href ? (
                      <a href={row.href} className="font-semibold text-stone-900 hover:underline">{row.value}</a>
                    ) : (
                      <p className="font-semibold text-stone-900">{row.value}</p>
                    )}
                    <p className="text-sm text-stone-400 mt-0.5">{row.sub}</p>
                  </div>
                </div>
              ))}

              {/* Final CTA */}
              <div
                className="rounded-2xl p-6 text-white"
                style={{ backgroundColor: color }}
              >
                <p className="font-semibold text-lg mb-1">Ready to get started?</p>
                <p className="text-white/70 text-sm mb-4">
                  Use the chat button on this page — the team will confirm your appointment within the hour.
                </p>
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center gap-2 bg-white rounded-full px-5 py-2.5 text-sm font-semibold btn-press underline-draw"
                  style={{ color }}
                >
                  <Phone className="h-4 w-4" />
                  Call {business.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-stone-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: color }}
              >
                {business.name[0]}
              </div>
            )}
            <span className="font-semibold text-sm">{business.name}</span>
          </div>
          <p className="text-stone-500 text-xs text-center">
            © {new Date().getFullYear()} {business.name} · {business.city} · All rights reserved
          </p>
          <p className="text-stone-600 text-xs">
            Powered by{" "}
            <span className="text-stone-400 font-medium">ClinicLeads</span>
          </p>
        </div>
      </footer>

      {/* ── Page-wide animation system (client) ─────────────────────────── */}
      <DemoAnimations color={color} />

      {/* ── Premium chatbot widget (client) ─────────────────────────────── */}
      <PremiumChatbotWidget
        slug={params.businessSlug}
        business={{
          id: business.id,
          name: business.name,
          ownerName: business.ownerName,
          specialty: business.specialty,
          brandColor: color,
          logoUrl: business.logoUrl,
          phone: business.phone,
        }}
        questions={questions}
      />
    </div>
  );
}
