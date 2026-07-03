// Shared animation design tokens — one source of truth for the whole page.
// Apply these in CSS (as string values) or in JS (for spring-based motion).
export const ANIM = {
  duration: { fast: 150, base: 300, slow: 500 },
  easing: {
    standard: "cubic-bezier(0.22, 1, 0.36, 1)",
    spring:   "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  // Spring values for any library that accepts stiffness/damping
  spring: { stiffness: 260, damping: 20 },
} as const;
