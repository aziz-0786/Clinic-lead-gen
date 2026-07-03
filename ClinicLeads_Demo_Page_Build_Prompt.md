# BUILD PROMPT — Rebuild the ClinicLeads "View Demo Page" (Customer-Facing)

> **Context for the agent:** This is an existing project — **ClinicLeads** (the doctor/clinic version of the lead-qualification platform). There's already a working public demo page (currently a flat teal header + stat cards + a plain chevron-icon services list + a basic chat bubble) backed by a real `Business`/`Lead`/`ChatbotQuestion` schema and intent-scoring API. **This prompt rebuilds that page's design and the chatbot widget's UI/motion only** — find the existing route (likely `/demo/[businessSlug]`) and the existing chatbot/question-flow logic before writing anything, and wire the new design into that, rather than inventing a new data model or duplicating the route.

Paste this whole prompt into your AI coding agent in VS Code.

---

## GOAL

Take the current functional-but-plain demo page and rebuild it to feel like a premium private clinic's real website — the kind a doctor would be proud to show a patient — while keeping the AI chatbot as the obvious hero feature, not an afterthought bolted onto a generic template.

---

## 1. DESIGN REFERENCE — what to take from srdentalzone.com

I looked at the reference site directly. Don't clone it (different clinic, different copy, different logo) — but **lift the structural and motion patterns** below, which is what makes it read as "premium private practice" rather than "generic SaaS template":

- **Full-bleed hero** (video background, or a high-quality static clinic/treatment-room photo as a fallback for performance) with a dark, warm overlay. Centered (not left-aligned) layout: small kicker line, then a **large two-line headline using a "duotone" effect** — the first line/words in solid bold text, the next word(s) fading into a soft gradient/lower-opacity tone so it visually recedes into the background. This single typographic trick does a lot of the "premium" lifting — build it as a reusable `<DuotoneHeading>` component since it repeats on every section header.
- Below the headline: a short one-sentence subhead, a single prominent CTA button, a thin horizontal divider, then a **centered trust row** (star rating + review count style — you already have `Patient Rating` data, surface it here exactly like this).
- **Small uppercase "kicker" tags above section headings** (icon + label, e.g. a small tooth-icon + "Clinical Excellence") in the accent color — used consistently above every major section heading, paired with the duotone heading pattern.
- **Service/treatment cards**: white cards with a thin rounded border (not heavy shadows), a centered line-icon illustration (not photos) in the accent color, a bold short title, one line of supporting copy, and a small "Learn More →" link in the accent color. Laid out 3–4 across on desktop, collapsing to 1–2 on mobile.
- **A "Why Choose Us" section**: a checklist of short capability bullets on one side, paired with **3 numbered feature cards** (big stylized numeral "1/2/3", short title, short description) on the other.
- **A 4-step "patient journey" timeline**: icon-illustrated steps walking through Book → Diagnose → Plan → Result, laid out horizontally on desktop / stacked on mobile.
- **A testimonials carousel**: large quote-mark icon, the quote text, then a small avatar + name + "Happy Patient"-style label underneath, with simple dot pagination.
- **Alternating cream/white section backgrounds** for rhythm down the page (the reference uses a soft warm cream, not stark white, between sections).
- **A contact section with a map embed** + icon-labeled phone/address/email, followed by one final short reassurance + booking CTA banner before the footer.
- **Stacked circular floating action buttons**, bottom-right (the reference has WhatsApp + Call stacked). For this product, **don't just copy that** — see §3, you're upgrading this pattern with the AI chat launcher as the primary action.

### Color & type direction (inspired by, not copied from — drive it off `business.brandColor`)
- The reference uses a warm walnut/dark-brown hero overlay with a **gold/amber accent** for CTAs, icons, and links, and a soft cream background for alternating sections. For this product: **derive the accent from each business's `brandColor`** (already a Settings field) rather than hardcoding gold — but keep the same *warm, premium, low-contrast-background* feeling: soft cream (`#FBF6F0`-ish) alternating with white, charcoal (not pure black) body text.
- Centered, generous-letter-spaced small caps for the kicker tags and nav.
- A confident bold sans for headlines, a calmer regular-weight sans for body copy.

---

## 2. PAGE STRUCTURE — rebuild `/demo/[businessSlug]` (or wherever the existing route lives)

Pull `name`, `ownerName`, `specialty`, `city`, `logoUrl`, `brandColor`, and the existing stat fields from `Business`. Write fresh copy per section — don't reuse the reference site's literal wording, just its structural pattern.

1. **Hero** — clinic photo/video background, dark warm overlay, kicker line (e.g. clinic's tagline), duotone two-line headline naming the clinic/specialty, one-sentence subhead, primary CTA ("Talk to Our AI Assistant" or "Check Symptoms Now" — something that points at the chatbot, not a generic "Book Now"), divider, centered patient-rating trust row reusing your existing rating data.
2. **Stat band** — upgrade the current 4 stat cards (Years of Practice, Patients Served, Patient Rating, Hours) into the reference's icon-illustrated minimal style; animate each number counting up when scrolled into view.
3. **"Our [Specialty] Services"** — rebuild the current chevron list as proper icon-illustrated cards (line-icon, title, one-line description, "Learn More" link) — keep the service list driven by the clinic's `specialty`/configured concern types, not hardcoded.
4. **"Why Choose [Clinic Name]"** — checklist + 3 numbered cards. Use this section to actually sell the product's real differentiator: fast response / AI-triaged urgency / never miss an emergency inquiry — written as patient-facing reassurance (e.g. "Your inquiry is reviewed instantly, any time of day" rather than internal sales language).
5. **"Your Visit, Step by Step"** — 4-step horizontal timeline: Reach Out → AI Triage (the chatbot, named plainly so it doubles as a feature callout inside the demo itself) → Diagnosis & Plan → Confident Result.
6. **Testimonials carousel** — quote icon, quote, avatar + name + label, dot pagination, auto-rotating with manual override.
7. **Contact section** — map embed (placeholder coordinates fine), icon row for phone/address/email pulled from `Business`, one short closing reassurance line + final CTA button into the chatbot.
8. **Footer** — simple, clinic info + placeholder socials.

---

## 3. FLOATING ACTION CLUSTER + THE "POPPING" CHATBOT

The reference site stacks plain WhatsApp + Call buttons. Upgrade this into a small **expandable FAB cluster** with the AI chatbot as the clear hero action:

- A single primary floating button, bottom-right, themed in `brandColor`, with a soft **pulsing glow ring** animating continuously (slow breathing scale+opacity) to draw the eye — this is the AI chat launcher.
- Tapping it either opens the chat directly, **or** (your call, pick whichever reads cleaner) briefly expands two smaller secondary buttons above it (WhatsApp, Call) with a staggered slide-up animation, so all three contact paths live in one tidy cluster instead of three competing floating buttons.
- After **4–6 seconds** on the page, auto-pop a small teaser speech bubble next to the chat launcher (e.g. "🦷 Tooth pain or just curious? I can help in under a minute.") sliding/bouncing in with a spring animation. Dismissible; reappears **at most once more** later in the session (e.g. when the visitor reaches the "Why Choose Us" section) if ignored — don't nag past that. Respect `prefers-reduced-motion` with a static fallback.
- **Opening the chat**: spring/elastic scale+slide animation from the launcher's position; full-screen bottom-sheet with swipe-down-to-dismiss on mobile.
- **During conversation**: animated typing-indicator dots before bot messages, a "Question X of Y" progress bar tied to the real question count from the existing flow, message bubbles slide/fade in, quick-reply buttons get a clear pressed/selected animation.
- **On completion**: a small celebratory micro-animation (check-mark draw-in or brief confetti) before the confirmation message, using the patient's name for a personal touch.
- Theme the entire widget (launcher, bubbles, progress bar) off `business.brandColor` — this has to work per-clinic, not just this one demo.

---

## 4. SHARED COMPONENTS TO BUILD (since these repeat constantly)

- `<DuotoneHeading lead="Precision" fade="Care" />`-style component for every section header.
- `<KickerTag icon="..." label="..." />` for the small overline tags above headings.
- `<IconFeatureCard icon="..." title="..." description="..." />` for the services grid and the numbered "why us" cards.
- `useCountUp` hook (IntersectionObserver-triggered) for the stat band.
- `useScrollReveal` hook (IntersectionObserver-based fade+slide-up) applied consistently across sections.

---

## 5. RESPONSIVENESS

Mobile-first. Specifically verify:
- Hero video swaps to a static image on mobile/low-bandwidth (`prefers-reduced-data` or a simple viewport check) — don't force-load heavy video on phones.
- Services grid and numbered "why us" cards collapse cleanly to 1-column.
- The 4-step journey timeline stacks vertically with a connecting line, not a cramped horizontal squeeze.
- Nav collapses to a hamburger drawer below tablet width.
- Chatbot becomes the full-screen bottom-sheet pattern below ~640px, and the FAB cluster doesn't overlap the bottom nav/safe area on mobile browsers.

---

## 6. BUILD STEPS

1. Locate the existing public route, current page implementation, and the chatbot API/question-flow logic. Confirm the data contract before touching UI.
2. Extend the Tailwind theme: accent derived from `business.brandColor`, warm cream alternating background, charcoal body text — don't hardcode the reference's gold.
3. Build `<DuotoneHeading>`, `<KickerTag>`, `<IconFeatureCard>`, `useCountUp`, `useScrollReveal`.
4. Rebuild the hero section.
5. Rebuild the stat band using `useCountUp`.
6. Rebuild the services section as icon-card grid.
7. Build the "Why Choose Us" checklist + numbered cards section.
8. Build the 4-step patient journey timeline.
9. Build the testimonials carousel.
10. Build the contact section + final CTA banner + footer.
11. Rebuild the floating action cluster + chatbot widget shell per §3, wired to the existing backend flow.
12. Responsive pass + `prefers-reduced-motion`/`prefers-reduced-data` fallbacks + a quick performance check (video hero + lots of scroll animation is exactly the combination that gets janky if not handled carefully).

---

Build it. If the existing data contract is missing something small this needs (e.g. no testimonial fields exist yet), extend the schema minimally with sensible placeholder content rather than blocking — but don't restructure anything in the already-working dashboard or scoring logic.
