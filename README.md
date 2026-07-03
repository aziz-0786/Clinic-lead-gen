# ClinicLeads — AI Patient Inquiry Qualification Platform

A multi-tenant SaaS platform for Indian clinics. Patients fill out a chatbot on a public landing page, get scored by intent (HIGH / MEDIUM / LOW), and the doctor/front-desk sees a live dashboard with alerts, kanban pipeline, and missed-opportunity reports.

## Demo Accounts (pre-seeded)

| Email | Password | Slug | Specialty | Tier |
|---|---|---|---|---|
| demo@smiledental.com | demo1234 | smile-dental-raipur | Dental | PRO |
| demo@glowskin.com | demo1234 | glowskin-bangalore | Skin/Cosmetic | GROWTH |
| demo@apollonagpur.com | demo1234 | apollo-multispecialty-nagpur | Multi-Specialty | STARTER |

## Routes

- `/login` — clinic owner login
- `/demo/[slug]` — public patient landing page with chatbot widget
- `/dashboard` — KPI overview + recent leads
- `/dashboard/leads` — table + kanban pipeline, emergency leads highlighted
- `/dashboard/leads/[id]` — full lead profile, alerts, follow-up sequences
- `/dashboard/reports` — monthly report, missed-opportunity calculator (Pro)
- `/dashboard/chatbot-settings` — edit questions, branding/color
- `/dashboard/settings` — clinic profile, tier display, feature gating

## Run in Development

```powershell
# 1. Install dependencies (already done if you're reading this)
npm install --legacy-peer-deps

# 2. Create/reset the database and seed demo data
$env:DATABASE_URL = "file:./dev.db"
npx prisma db push
npx tsx prisma/seed.ts

# 3. Start the dev server
npm run dev
```

Then open http://localhost:3000

> The `.env.local` file already has all required values for local development. No changes needed.

## Reset the Database

```powershell
$env:DATABASE_URL = "file:./dev.db"
npm run db:reset
```

## Production Checklist

- Set `NEXTAUTH_SECRET` to a strong random value (`openssl rand -base64 32`)
- Change `DATABASE_URL` to a Postgres connection string and update `prisma/schema.prisma` provider to `postgresql`
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for real email alerts
- Replace `lib/whatsapp.ts`'s `sendWhatsAppAlert` with your WhatsApp Business API call

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
