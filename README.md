# ClinicLeads — AI Patient Inquiry Qualification Platform

A SaaS platform for Indian clinics. Patients fill out a chatbot on a public landing page, get scored by intent (HIGH / MEDIUM / LOW), and the doctor/front-desk sees a live dashboard with alerts, kanban pipeline, and missed-opportunity reports.

The `/dashboard` routes are unauthenticated and always show a single business,
resolved by `lib/business.ts`: the one matching the `BUSINESS_SLUG` env var, or
the oldest row in the `Business` table if that's unset. If you seed multiple
demo businesses, set `BUSINESS_SLUG` to pick which one the dashboard serves.

## Demo Businesses (pre-seeded, no login required)

| Slug | Specialty | Tier |
|---|---|---|
| smile-dental-raipur | Dental | PRO |
| glowskin-bangalore | Skin/Cosmetic | GROWTH |
| apollo-multispecialty-nagpur | Multi-Specialty | STARTER |

## Routes

- `/demo/[slug]` — public patient landing page with chatbot widget
- `/dashboard` — KPI overview + recent leads
- `/dashboard/leads` — table + kanban pipeline, emergency leads highlighted
- `/dashboard/leads/[id]` — full lead profile, alerts, follow-up sequences
- `/dashboard/reports` — monthly report, missed-opportunity calculator (Pro)
- `/dashboard/chatbot-settings` — edit questions, branding/color
- `/dashboard/settings` — clinic profile, tier display, feature gating

## Run in Development

The database is Neon Postgres, linked to this project via the Vercel
integration. Pull the real connection strings before doing anything else —
Prisma's CLI (`generate`/`migrate`) only auto-loads `.env`, not `.env.local`,
so use a single `.env` file locally to keep `next dev` and `npx prisma ...`
reading the same values. `.env.example` documents every var.

```powershell
# 1. Install dependencies (already done if you're reading this)
npm install --legacy-peer-deps

# 2. Link this folder to the Vercel project (one-time) and pull real env vars
npx vercel link
npx vercel env pull .env

# 3. Apply the schema to Neon and seed demo data
npx prisma migrate deploy
npx tsx prisma/seed.ts

# 4. Start the dev server
npm run dev
```

Then open http://localhost:3000

## Reset the Database

```powershell
npx prisma migrate reset
```

## Production Checklist

- In Vercel → Project → Settings → Environment Variables, confirm the Neon
  integration set both `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`
  (direct) — `prisma/schema.prisma` requires both, and the build fails
  without `DATABASE_URL_UNPOOLED` even though the app only queries through
  `DATABASE_URL` at runtime
- Set `APP_URL` to your production URL (used to build links in alert emails/WhatsApp messages)
- Set `BUSINESS_SLUG` if more than one business exists in the database
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for real email alerts
- Replace `lib/whatsapp.ts`'s `sendWhatsAppAlert` with your WhatsApp Business API call
- The `/dashboard` routes have no authentication — put them behind Vercel
  Password Protection, a proxy, or add your own gate before sharing the URL

## Intent Scoring

| Signal | Points |
|---|---|
| Urgency: Emergency today | +45 |
| Urgency: This week | +25 |
| Urgency: This month | +10 |
| Concern matches specialty | +15 |
| Returning patient | +15 |
| Phone + email provided | +25 |

Score ≥ 70 → HIGH · 40–69 → MEDIUM · < 40 → LOW

## Tier Feature Gates

| Feature | Starter | Growth | Pro |
|---|---|---|---|
| Chatbot widget | ✓ | ✓ | ✓ |
| Email alert (high/emergency) | — | ✓ | ✓ |
| WhatsApp alert (high/emergency) | — | — | ✓ |
| Full monthly report + charts | — | ✓ | ✓ |
| Missed-Opportunity Calculator | — | — | ✓ |
| Follow-up sequence automation | — | ✓ | ✓ |
