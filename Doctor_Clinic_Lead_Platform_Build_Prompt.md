# BUILD PROMPT — Paste this whole document into Claude Code / Cursor in VS Code

> **How to use this:** Open an empty folder in VS Code, open the integrated terminal, start your AI coding agent (e.g. `claude` for Claude Code), and paste everything below the line as your first message.

---

## PROJECT BRIEF

Build a full-stack, multi-tenant **AI Patient-Inquiry Qualification Platform** for doctors and clinics in India (dental, multi-specialty, cosmetic/skin, etc. — the same offer structure you're using for SMB outreach, e.g. your Chhattisgarh dental/multi-specialty clinic list). It has two faces:

1. **Customer-side**: a public clinic landing page with an embedded AI chatbot widget that greets visitors, asks 4–5 triage-style questions, and scores them High / Medium / Low intent (urgency-weighted, since a same-day emergency inquiry is worth more to a clinic than a "just researching" one).
2. **Clinic-owner dashboard**: a private admin panel where the doctor/clinic manager logs in to see patient inquiries, manage the pipeline, trigger front-desk alerts, view reports, and configure their chatbot/branding.

This is a **template product** you'll deploy once per client, but build it multi-tenant from day one (a `Business` table) so the same codebase demos to multiple prospect clinics and later serves multiple paying clients without rearchitecting. This product shares the same underlying architecture as your real-estate-broker version — reuse that codebase's structure where it fits (auth, multi-tenancy, alerts, reports), but the data model, qualifying questions, and scoring logic below are specific to clinics and should not just be a relabeled copy.

Treat this as a real, sellable SaaS product. Production-quality code, clean structure, working demo with seed data at the end.

---

## 1. TECH STACK (defaults — use unless you have a strong reason not to)

- **Framework:** Next.js 14+ (App Router), TypeScript
- **Styling/UI:** Tailwind CSS + shadcn/ui components
- **Database:** SQLite via Prisma for local dev (Postgres-ready datasource swap for prod)
- **Auth:** NextAuth.js, credentials provider (email + password) for clinic owners/front-desk staff. No login needed for patients — they stay anonymous through the chatbot.
- **Charts:** Recharts
- **Email:** Nodemailer (console transport in dev, real SMTP in prod)
- **WhatsApp:** Build alerts behind a swappable interface (`sendWhatsAppAlert()`), mock/console implementation by default — don't block the build waiting on WhatsApp Business API approval.
- **PDF export:** `@react-pdf/renderer` or HTML-to-PDF route for the monthly report.

State your reasoning if you deviate, but don't ask me to confirm — pick the best option and proceed.

---

## 2. CORE DATA MODEL

**Business** (the tenant — one row per clinic/doctor)
- id, slug (for demo URLs), name, ownerName (doctor's name), email (login), passwordHash
- city, phone, whatsappNumber, alertEmail
- specialty: enum-ish string (`Dental | Multi-Specialty | Skin/Cosmetic | General Physician | Other`) — drives which question set/options are shown
- tier: enum `STARTER | GROWTH | PRO`
- logoUrl, brandColor
- avgPatientValue (₹ revenue per converted patient visit), avgInquiryToBookingRate (%) — used by the Missed-Opportunity Calculator
- createdAt

**ChatbotQuestion** (per-business, configurable; seed 4–5 defaults per business based on specialty)
- id, businessId, order, questionText, type (`single_choice | text | number`), options (JSON), mapsToIntentWeight (number)

**Lead** (a patient inquiry)
- id, businessId, name, phone, email
- concernType (e.g. "Tooth Pain", "Cosmetic Consult", "Routine Checkup" — options vary by `specialty`)
- urgency: enum `EMERGENCY_TODAY | THIS_WEEK | THIS_MONTH | JUST_EXPLORING`
- visitMode (`In-Clinic | Teleconsult`)
- patientType (`New | Returning`)
- hasInsurance (boolean, optional — relevant for some specialties)
- answers (JSON — raw chatbot transcript)
- intentLabel: enum `HIGH | MEDIUM | LOW`
- intentScore (0–100, computed)
- status: enum `NEW | CONTACTED | BOOKED | VISITED | NO_SHOW | LOST`
- source (e.g. "Website Chatbot", "Manual Entry")
- notes (text, owner-editable)
- createdAt, lastContactedAt, appointmentTime (nullable)

**FollowUpSequence** (reminder nudges for patients who haven't booked)
- id, leadId, day (1/3/7), channel (`whatsapp | email`), templateText, status (`pending | sent | skipped`), scheduledFor, sentAt

**AlertLog**
- id, leadId, channel, status, sentAt, payload (JSON)

**MonthlyReport** (computed on the fly or cached — your call)
- businessId, month, totalLeads, byIntent, byStatus, bookingRate, estimatedMissedOpportunityValue

---

## 3. CUSTOMER-SIDE (public, no login)

### 3.1 Landing page — `/demo/[businessSlug]`
A clean, mobile-first clinic landing page rendered per-business (name, logo, brand color, specialty pulled from `Business`). Sections: hero with doctor/clinic name and credentials placeholder, services/specialties offered, trust badges (years of practice, patient count — placeholder copy), and the chatbot widget floating bottom-right. This single dynamic route is what makes producing a branded demo for each new prospect clinic trivial — add a `Business` row, send the link.

### 3.2 Chatbot widget (the core product)
- Floating launcher → opens a chat panel.
- Greets the visitor by name, then asks the business's configured questions in order. Default set (override per specialty):
  1. "What do you need help with?" — options drawn from `specialty` (e.g. Dental → Tooth Pain / Cleaning / Implants / Cosmetic Dentistry / Other)
  2. "How soon do you need this?" — Emergency/today, This week, This month, Just exploring
  3. "Would you prefer an in-clinic visit or a teleconsultation?"
  4. "Have you visited us before?" — New / Returning patient
  5. Capture name, phone, email, preferred date/time if not already given.
- After the last question, save the `Lead`, compute `intentScore`/`intentLabel`, show a confirmation, and (server-side) trigger the alert pipeline if the tier allows it and urgency/intent warrants it.
- **Intent scoring logic (implement as a clear, documented function):**
  - Urgency: `EMERGENCY_TODAY` → +45, `THIS_WEEK` → +25, `THIS_MONTH` → +10, `JUST_EXPLORING` → 0
  - Concern matches business's core specialty → +15
  - Returning patient → +15 (retention value)
  - Complete contact info (phone + email) → +25
  - Sum → clamp 0–100 → `≥70 HIGH`, `40–69 MEDIUM`, `<40 LOW`
- Build as a self-contained, embeddable component — don't tightly couple it to dashboard internals.

---

## 4. CLINIC OWNER DASHBOARD (auth-protected, `/dashboard/*`)

### 4.1 `/login`
Email/password login (NextAuth credentials).

### 4.2 `/dashboard` — Overview
KPI cards (total inquiries this month, Emergency/High-intent count, booking rate, estimated revenue from booked visits) + 2 charts: inquiries-over-time line chart, intent-breakdown pie/bar chart.

### 4.3 `/dashboard/leads`
- Table AND kanban view (toggle) by `status` (New → Contacted → Booked → Visited / No-Show / Lost).
- Filters: intent label, urgency, status, date range, concern type.
- Search by name/phone.
- **Emergency leads should visually stand out** (red badge/sort-to-top) — this is the single most time-sensitive signal in this niche.
- Click a row → `/dashboard/leads/[id]`.

### 4.4 `/dashboard/leads/[id]`
- Full inquiry profile, raw Q&A transcript, editable notes, status dropdown (logs an activity timeline), appointment time field.
- Buttons: "Send WhatsApp Alert", "Send Email Alert" (manual trigger, same functions as the automated pipeline), "Start Follow-Up Sequence" (creates the day-1/3/7 `FollowUpSequence` rows and shows sent/pending status).

### 4.5 `/dashboard/reports`
- Monthly report: stats table + charts, scoped to a selectable month.
- **Missed-Opportunity Calculator**: an interactive tool using `avgPatientValue` and the business's actual High/Medium-intent leads that never reached `Booked`/`Visited`, showing "₹X in potential patient revenue lost last month from inquiries that weren't followed up fast enough." Build it as a real working feature, not static copy.
- "Export PDF" and "Export CSV" for the monthly report.

### 4.6 `/dashboard/chatbot-settings`
- Edit the qualifying questions/options per specialty (drag to reorder).
- Branding: logo upload, brand color picker — live preview against the actual widget on `/demo/[slug]`.
- This page is the engine behind producing a branded chatbot demo for a new prospect clinic in minutes.

### 4.7 `/dashboard/settings`
- Business profile (clinic name, doctor name, specialty, contact info, WhatsApp number, alert email).
- Tier display and feature gating (see §5), with upgrade CTA hooks (no real payment integration needed).

---

## 5. TIER-BASED FEATURE GATING

Mirror the gating pattern from the real-estate version (adjust copy, keep the mechanism — a single `getTierFeatures(tier)` helper, gated UI shows lock icon + "Upgrade" tooltip rather than hiding):

| Feature | Starter | Growth | Pro |
|---|---|---|---|
| Chatbot widget | ✅ | ✅ | ✅ |
| Email alert on High-intent / Emergency inquiry | ❌ | ✅ | ✅ |
| WhatsApp alert on High-intent / Emergency inquiry | ❌ | ❌ | ✅ |
| Monthly report | Basic (counts only) | Full (+ charts) | Full + Missed-Opportunity Calculator highlighted |
| Follow-up sequence automation | Manual only | ✅ | ✅ |

> Note: I didn't find a finalized pricing/tier doc for the doctors niche in the project (only one exists for real estate brokers). The structure above mirrors that one as a placeholder — swap in real ₹ figures once you've drafted the clinic-specific pitch doc, but the feature gates themselves are a reasonable default to build against now.

---

## 6. BUILD PHASES (work through in order; summarize after each before moving on)

1. **Scaffold**: Next.js + TS + Tailwind + shadcn/ui init, Prisma schema + migration, seed script with 2–3 demo `Business` rows (different specialties and tiers) and ~15 sample leads each with varied urgency/intent/status.
2. **Auth**: NextAuth credentials login, protected `/dashboard` layout.
3. **Customer-side**: `/demo/[slug]` landing page + chatbot widget + specialty-aware questions + intent scoring + lead creation.
4. **Dashboard core**: overview KPIs/charts, leads table + kanban (with emergency-lead highlighting), lead detail page.
5. **Alerts + follow-up sequence**: mock email/WhatsApp senders, AlertLog, manual trigger buttons, sequence creation/tracking.
6. **Reports**: monthly report page, Missed-Opportunity Calculator, PDF/CSV export.
7. **Settings + tier gating**: chatbot-settings (specialty questions/branding), business settings, feature-flag UI throughout.
8. **Polish**: mobile responsive check (front-desk staff will use this on phones), loading/empty states, README with setup + seeded demo login credentials.

---

## 7. DESIGN DIRECTION

Calm, trustworthy, clinical-but-warm — patients researching a doctor are more anxiety-sensitive than property buyers. Avoid stock medical clichés (stethoscope icons, generic blue gradients). Use the per-business `brandColor` to keep each clinic's demo feeling distinct, not templated. Emergency/urgent UI states (badges, alerts) should be visually unmistakable without being alarming.

---

## 8. OUT OF SCOPE FOR NOW (don't build, just leave clean extension points)

- Real payment/billing for tier upgrades
- Real WhatsApp Business API approval flow (mock only)
- Multi-staff roles per clinic (one owner/front-desk login for now)
- Actual appointment-calendar sync (Google Calendar etc.) — just store `appointmentTime` as a field for now

---

Build it. Ask me only if something is genuinely ambiguous after you've made your own best judgment call — otherwise proceed and explain assumptions in commit messages or a short build log.
