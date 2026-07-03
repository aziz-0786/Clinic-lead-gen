"use client";
/**
 * DemoAnimations — mounts invisibly and wires up the full page animation system.
 *
 * Handles:
 *  • Lenis smooth scroll (pointer: fine, no reduced motion)
 *  • Scroll-reveal via IntersectionObserver on [data-reveal] elements
 *  • Stagger reveals on children of [data-stagger] containers
 *  • Numeral scale-in on [data-numeral] elements inside [data-reveal-numcard]
 *  • Timeline line draw on [data-timeline-line]
 *  • Magnetic hover on [data-magnetic] elements (pointer: fine)
 *  • Mobile tap feedback on [data-tap] elements
 */
import { useEffect } from "react";
import { useLenis } from "@/hooks/useLenis";
import { ANIM } from "@/lib/animation";
import { CustomCursor } from "./CustomCursor";

export function DemoAnimations({ color }: { color: string }) {
  useLenis();

  // ── Scroll-reveal (single elements) ───────────────────────────────────────
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Exclude children of [data-stagger] — those have their own stagger observer
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
      .filter(el => !el.closest("[data-stagger]"));
    if (reducedMotion) {
      revealEls.forEach(el => el.classList.add("is-revealed"));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ── Stagger reveals (service cards, numbered cards) ───────────────────────
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const containers = Array.from(document.querySelectorAll<HTMLElement>("[data-stagger]"));

    containers.forEach(container => {
      const isMobile = window.innerWidth < 768;
      const delayMs = isMobile ? 40 : 80; // tighter stagger on mobile
      const children = Array.from(container.querySelectorAll<HTMLElement>("[data-reveal]"));

      if (reducedMotion) {
        children.forEach(el => el.classList.add("is-revealed"));
        return;
      }

      children.forEach((el, i) => {
        el.style.transitionDelay = `${i * delayMs}ms`;
      });

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            children.forEach(el => el.classList.add("is-revealed"));
            obs.disconnect();
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      );
      obs.observe(container);
    });
  }, []);

  // ── Numbered card stagger with numeral leading scale ──────────────────────
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal-numcard]"));
    if (reducedMotion) {
      cards.forEach(card => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
        card.querySelector<HTMLElement>("[data-numeral]")?.classList.add("is-revealed");
      });
      return;
    }

    cards.forEach((card, i) => {
      card.style.transitionDelay = `${i * 100}ms`;
    });

    const container = cards[0]?.closest("[data-stagger-numcards]");
    if (!container) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          cards.forEach((card, i) => {
            // Numeral fires slightly before the card text
            setTimeout(() => {
              card.querySelector<HTMLElement>("[data-numeral]")?.classList.add("is-revealed");
            }, i * 100);
            setTimeout(() => {
              // Must set inline styles directly — inline style beats any CSS class
              card.style.opacity = "1";
              card.style.transform = "translateY(0)";
            }, i * 100 + 60);
          });
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(container);
  }, []);

  // ── Timeline line draw ────────────────────────────────────────────────────
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const hLine = document.querySelector<HTMLElement>("[data-timeline-line]");
    const vLine = document.querySelector<HTMLElement>("[data-timeline-line-v]");

    [hLine, vLine].forEach(line => {
      if (!line) return;
      if (reducedMotion) { line.classList.add("is-revealed"); return; }

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            line!.classList.add("is-revealed");
            obs.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      obs.observe(line);
    });
  }, []);

  // ── Magnetic hover on [data-magnetic] elements ────────────────────────────
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
    const cleanups: (() => void)[] = [];

    elements.forEach(el => {
      const targetPos = { x: 0, y: 0 };
      const curPos = { x: 0, y: 0 };
      let raf: number;
      let active = false;

      function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

      function tick() {
        curPos.x = lerp(curPos.x, targetPos.x, 0.13);
        curPos.y = lerp(curPos.y, targetPos.y, 0.13);
        el.style.transform = `translate(${curPos.x.toFixed(2)}px, ${curPos.y.toFixed(2)}px)`;

        const atRest = Math.abs(curPos.x) < 0.05 && Math.abs(curPos.y) < 0.05
          && targetPos.x === 0 && targetPos.y === 0;
        if (!atRest || active) {
          raf = requestAnimationFrame(tick);
        } else {
          el.style.transform = "";
        }
      }

      function onMove(e: MouseEvent) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Tight radius — only activates when cursor is directly over the element
        const radius = Math.max(rect.width, rect.height) * 0.65;
        if (dist < radius) {
          if (!active) { active = true; raf = requestAnimationFrame(tick); }
          const maxShift = 8;
          targetPos.x = Math.max(-maxShift, Math.min(maxShift, dx * 0.12));
          targetPos.y = Math.max(-maxShift, Math.min(maxShift, dy * 0.12));
        } else {
          targetPos.x = 0;
          targetPos.y = 0;
        }
      }

      function onLeave() {
        active = false;
        targetPos.x = 0;
        targetPos.y = 0;
        raf = requestAnimationFrame(tick);
      }

      window.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);

      cleanups.push(() => {
        window.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
        cancelAnimationFrame(raf);
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, []);

  // ── Mobile tap feedback ───────────────────────────────────────────────────
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) return; // touch devices only

    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-tap]"));
    const cleanups: (() => void)[] = [];

    elements.forEach(el => {
      function onTouchStart() {
        el.classList.remove("tapping");
        void el.offsetWidth; // force reflow to restart animation
        el.classList.add("tapping");
      }
      function onAnimEnd() { el.classList.remove("tapping"); }

      el.addEventListener("touchstart", onTouchStart, { passive: true });
      el.addEventListener("animationend", onAnimEnd);

      cleanups.push(() => {
        el.removeEventListener("touchstart", onTouchStart);
        el.removeEventListener("animationend", onAnimEnd);
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, []);

  return <CustomCursor color={color} />;
}
