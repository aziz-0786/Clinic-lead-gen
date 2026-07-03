"use client";
import { useEffect, useRef, useState } from "react";

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/**
 * Reveals a list of sibling elements with a stagger delay between each.
 * Returns a ref to attach to the container. Each direct child that has
 * data-reveal-child will be revealed in sequence.
 */
export function useStaggerReveal(
  staggerMs = 80,
  threshold = 0.1
) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.querySelectorAll<HTMLElement>("[data-reveal-child]"));
    if (children.length === 0) return;

    // Pre-hide all children
    children.forEach((el, i) => {
      el.style.transitionDelay = `${i * staggerMs}ms`;
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach(el => el.classList.add("is-revealed"));
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      children.forEach(el => { el.style.transitionDelay = ""; });
    };
  }, [staggerMs, threshold]);

  return containerRef;
}
