"use client";
import { useEffect } from "react";

export function useLenis() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf: number;
    let lenisInstance: { raf: (t: number) => void; destroy: () => void } | null = null;

    (async () => {
      try {
        const { default: Lenis } = await import("lenis");
        lenisInstance = new (Lenis as any)({
          lerp: 0.07,              // fraction per frame → natural exponential deceleration
          smoothWheel: true,
          wheelMultiplier: 0.9,   // slightly reduced for controlled feel
          touchMultiplier: 0,     // no touch override — keeps native momentum scroll
        });

        const tick = (time: number) => {
          lenisInstance!.raf(time);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        // Lenis load failure is non-fatal — native scroll still works
      }
    })();

    return () => {
      cancelAnimationFrame(raf);
      lenisInstance?.destroy();
    };
  }, []);
}
