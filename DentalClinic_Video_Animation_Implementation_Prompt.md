# BUILD PROMPT — ClinicLeads: Hero Video + Professional Animation System

> **Context for the agent:** This is the existing **ClinicLeads** project. The customer-facing demo page (`/demo/[businessSlug]`) and its design direction were already specified in a prior build prompt (SR Dental Zone–inspired: duotone headings, kicker tags, icon-illustrated service cards, numbered "Why Choose Us" cards, 4-step patient journey timeline, testimonial carousel, expandable chatbot FAB cluster). **This prompt does two things on top of that:** (1) wires in a real looping hero video, and (2) elevates the entire page with a cohesive, professional-grade animation system across scroll, hover, and mobile touch — not isolated effects bolted onto individual sections.

Paste this whole prompt into your AI coding agent in VS Code.

---

## PART 1 — HERO VIDEO INTEGRATION

A file named **`vid.mp4`** will be placed at `/public/vid.mp4` in this repo (already generated, compressed, ready to use).

Replace the current hero background (image/placeholder) with this video, implemented properly:

- `<video autoPlay muted loop playsInline preload="metadata">` pointed at `/vid.mp4`, sitting behind the existing warm dark overlay + kicker + duotone headline + CTA — don't change the layout on top of it, just swap the background layer.
- **Poster/fallback image:** use a calm clinic-interior still as the `poster` frame to avoid a blank flash before load, and as the full fallback on:
  - `prefers-reduced-motion: reduce` (render the static poster only, no video element)
  - Slow connections — check `navigator.connection.saveData`/`effectiveType` where available and fall back to the static poster
  - Mobile viewports below a sensible width threshold (your call — skip the video entirely on small screens to save data, or keep it if file size is small enough; verify before deciding)
- **Seamless loop polish:** if the raw clip has a visible jump at the loop point, implement a short crossfade (two stacked `<video>` elements offset slightly, or an opacity-crossfade trigger just before `loop` restarts). If the clip already loops cleanly, the native `loop` attribute is enough.
- Lazy-start: only call `.play()` once the hero is confirmed in viewport (IntersectionObserver) rather than unconditionally on page load.
- Make sure `vid.mp4` is excluded from any build-time image-optimization pipeline.

---

## PART 2 — PROFESSIONAL ANIMATION SYSTEM

One coherent system applied across the whole page — build shared primitives first, then apply them everywhere, so nothing feels like a one-off effect.

### 2.1 Smooth scroll (desktop)
- Add a lightweight smooth-scroll layer (Lenis) for desktop/pointer-fine devices only — gate behind a `pointer: fine` media query, never override native momentum scroll on touch devices.

### 2.2 Scroll-triggered reveals
- Build on (or upgrade) the `useScrollReveal` hook from the prior prompt: sections and cards fade + slide up as they enter the viewport, with a stagger between siblings (service cards revealing left-to-right with ~60–100ms delay between each, not all at once).
- **Parallax depth on the hero**: the video should drift slightly slower than the foreground kicker/headline/CTA as the page scrolls — subtle, just enough to read as depth, not a dramatic effect.
- **Numbered "Why Choose Us" cards**: stagger the 1/2/3 cards in on scroll, with the large numeral subtly scaling in just slightly ahead of its card's text.
- **Patient journey timeline**: on desktop, the connecting line between the 4 steps should visually "draw" left-to-right as the section scrolls into view (an animated stroke/width reveal); on mobile (stacked vertical layout) the line draws top-to-bottom instead.
- Use `transform`/`opacity` exclusively — never animate properties that trigger layout reflow.

### 2.3 Hover micro-interactions (desktop only — gate behind `pointer: fine`)
- **Magnetic buttons**: the hero CTA and final booking CTA subtly shift toward the cursor within a small radius, snapping back on mouse-leave. Keep it subtle and snappy, not slow/floaty.
- **Service card hover**: the line-icon gets a small rotate/bounce, the card lifts slightly (translateY -4 to -6px) with a soft shadow increase, and the "Learn More →" arrow nudges right.
- **Testimonial carousel**: pause auto-rotation on hover, resume on mouse-leave; dot pagination gets a satisfying scale/fill transition on hover and active state.
- **Link underline-draw**: nav links and "Learn More" links draw their underline left-to-right on hover.
- **Button press states**: scale down slightly (0.97) on `:active`.

### 2.4 Mobile touch interactions
- Scroll-reveals still apply via IntersectionObserver but keep them lighter on mobile: shorter travel distance/duration, no scroll-position-math parallax that can jank on mid-range Android.
- Testimonial carousel becomes swipe-driven on mobile (verify it feels native, not laggy).
- Tap feedback on cards/buttons: quick scale-down + subtle opacity flash on touch-start.
- The expandable FAB cluster (chat + WhatsApp + call) needs a clean staggered slide-up animation that doesn't feel cramped on small screens — verify thumb-reach positioning and that it doesn't overlap mobile browser chrome/safe-area.
- Respect `prefers-reduced-motion` exactly as on desktop — reveals become instant opacity swaps.

### 2.5 Chatbot widget polish carryover
- The pulsing FAB, teaser bubble, spring-open panel, typing indicators, progress bar, and completion celebration from the prior prompt should use the **same easing curves and spring values** as the rest of the page's animation system (see 2.6) — it should feel like one product, not a third-party widget dropped in.

### 2.6 Shared animation tokens
Define once, reuse everywhere — no per-component one-off curves:
```
durations: { fast: 150ms, base: 300ms, slow: 500ms }
easing: { standard: cubic-bezier(0.22, 1, 0.36, 1), spring: { stiffness: 260, damping: 20 } }
```
This consistency is what makes the page read as professionally built rather than any single flashy effect.

---

## PERFORMANCE GUARDRAILS (non-negotiable)

- Test on a throttled CPU (Chrome DevTools 4x–6x slowdown) — jank undermines the calm, premium feel this niche specifically needs (patients are anxiety-sensitive; a janky page reads as untrustworthy).
- Hero video must never block first paint — kicker/headline/CTA must render and be interactive immediately even while video is still loading.
- Run a Lighthouse pass after this work; fix any meaningful CLS or LCP regression before considering this done.
- All scroll observers disconnect/cleanup properly on unmount.

---

## BUILD STEPS

1. Add `/public/vid.mp4`, implement the hero video with poster fallback and reduced-motion/reduced-data handling (Part 1).
2. Build the shared animation token config (2.6).
3. Add Lenis smooth scroll, gated to pointer-fine (2.1).
4. Upgrade `useScrollReveal` with stagger support; apply hero parallax, numbered-card stagger, and the timeline draw-in animation (2.2).
5. Build magnetic-button, card-hover, and underline-draw primitives; apply across the page, gated to pointer-fine (2.3).
6. Add mobile tap-feedback states and verify the FAB cluster and testimonial swipe feel native on a real device (2.4).
7. Pass the same animation tokens into the chatbot widget's existing motion code (2.5).
8. Performance pass: throttled-CPU scroll test + Lighthouse check; fix any regressions.

Build it. If `vid.mp4` isn't in the repo yet when you start, scaffold the video element against the poster image alone so the rest of the work isn't blocked, and wire the real file in once it's added.
