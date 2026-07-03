"use client";
import { useEffect, useRef, useState } from "react";

export function CustomCursor({ color }: { color: string }) {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse   = useRef({ x: -200, y: -200 });
  const ring    = useRef({ x: -200, y: -200 });
  const rafRef  = useRef<number>(0);

  const [visible,  setVisible]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false); // avoid stale closure in rAF

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    // Inject a <style> so every element hides the OS cursor
    const styleEl = document.createElement("style");
    styleEl.textContent = "*, *::before, *::after { cursor: none !important; }";
    document.head.appendChild(styleEl);

    function onMove(e: MouseEvent) {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Dot snaps immediately
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
      }

      // Detect interactive hover (only set state on change)
      const target   = e.target as Element;
      const isActive = !!(
        target.closest("a, button, [role='button'], input, textarea, select, label, .service-card, [data-magnetic]")
      );
      if (isActive !== expandedRef.current) {
        expandedRef.current = isActive;
        setExpanded(isActive);
      }
    }

    function tick() {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.1;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.1;

      if (ringRef.current) {
        const size   = expandedRef.current ? 52 : 34;
        const offset = size / 2;
        ringRef.current.style.transform =
          `translate(${ring.current.x - offset}px, ${ring.current.y - offset}px)`;
        ringRef.current.style.width  = `${size}px`;
        ringRef.current.style.height = `${size}px`;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function onLeave() { setVisible(false); }
    function onEnter() { setVisible(true); }

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(rafRef.current);
      document.head.removeChild(styleEl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Dot — instant, filled */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full will-change-transform"
        style={{
          width:  "8px",
          height: "8px",
          backgroundColor: color,
          opacity: visible ? 1 : 0,
          transition: `opacity 0.25s, background-color 0.2s, box-shadow 0.2s`,
          boxShadow: `0 0 10px ${color}90, 0 0 20px ${color}40`,
          transform: "translate(-200px, -200px)",
        }}
      />
      {/* Ring — lags behind, outlined */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[9998] pointer-events-none rounded-full will-change-transform"
        style={{
          width:  "34px",
          height: "34px",
          border: `1.5px solid ${color}`,
          backgroundColor: expanded ? `${color}12` : "transparent",
          opacity: visible ? 0.75 : 0,
          transition: `opacity 0.3s, border-color 0.2s, background-color 0.25s cubic-bezier(0.22,1,0.36,1)`,
          transform: "translate(-200px, -200px)",
        }}
      />
    </>
  );
}
