import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0) translateY(12px)", opacity: "0" },
          "65%": { transform: "scale(1.08) translateY(-4px)", opacity: "1" },
          "80%": { transform: "scale(0.96) translateY(2px)" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "slide-up-fade": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in-spring": {
          "0%": { transform: "scale(0.75) translateY(40px)", opacity: "0" },
          "70%": { transform: "scale(1.03) translateY(-4px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(28px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "typing-bounce": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.35" },
          "30%": { transform: "translateY(-6px)", opacity: "1" },
        },
        "check-draw": {
          "0%": { strokeDashoffset: "24", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { strokeDashoffset: "0", opacity: "1" },
        },
        "confetti-pop": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "1" },
          "60%": { transform: "scale(1.4) rotate(180deg)", opacity: "1" },
          "100%": { transform: "scale(0.8) rotate(360deg)", opacity: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "0", transform: "scale(1.7)" },
        },
        // ── New animation system tokens ──────────────────────────────────────
        "reveal-up": {
          "0%": { transform: "translateY(32px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "reveal-up-sm": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "numeral-scale": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "timeline-draw": {
          "0%": { transform: "scaleX(0)", transformOrigin: "left" },
          "100%": { transform: "scaleX(1)", transformOrigin: "left" },
        },
        "timeline-draw-v": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "100%": { transform: "scaleY(1)", transformOrigin: "top" },
        },
        "underline-draw": {
          "0%": { transform: "scaleX(0)", transformOrigin: "left" },
          "100%": { transform: "scaleX(1)", transformOrigin: "left" },
        },
        "fab-slide-up": {
          "0%": { transform: "translateY(20px) scale(0.8)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "tap-feedback": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(0.95)", opacity: "0.85" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-in": "bounce-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "slide-up-fade": "slide-up-fade 0.28s ease-out both",
        "scale-in-spring": "scale-in-spring 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "fade-up": "fade-up 0.65s ease-out both",
        "typing-bounce": "typing-bounce 1.4s ease-in-out infinite",
        "check-draw": "check-draw 0.5s ease-out forwards",
        "confetti-pop": "confetti-pop 0.7s ease-out forwards",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        // New
        "reveal-up":       "reveal-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "reveal-up-sm":    "reveal-up-sm 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "numeral-scale":   "numeral-scale 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "timeline-draw":   "timeline-draw 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        "timeline-draw-v": "timeline-draw-v 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        "underline-draw":  "underline-draw 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fab-slide-up":    "fab-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "tap-feedback":    "tap-feedback 0.2s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
