import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Surface Hierarchy ──
        background: "#0e1418",
        surface: "#0e1418",
        "surface-dim": "#0e1418",
        "surface-bright": "#343a3e",
        "surface-container-lowest": "#090f13",
        "surface-container-low": "#161c20",
        "surface-container": "#1a2024",
        "surface-container-high": "#252b2f",
        "surface-container-highest": "#2f363a",
        "surface-variant": "#2f363a",
        "surface-tint": "#ffb3ad",

        // ── Primary (Crimson) ──
        primary: "#ffb3ad",
        "primary-container": "#a52a2a",
        "primary-fixed": "#ffdad7",
        "primary-fixed-dim": "#ffb3ad",
        "on-primary": "#68000a",
        "on-primary-container": "#ffc0bb",
        "on-primary-fixed": "#410004",
        "on-primary-fixed-variant": "#8c171b",
        "inverse-primary": "#ad302f",

        // ── Secondary (Gold) ──
        secondary: "#e9c349",
        "secondary-container": "#af8d11",
        "secondary-fixed": "#ffe088",
        "secondary-fixed-dim": "#e9c349",
        "on-secondary": "#3c2f00",
        "on-secondary-container": "#342800",
        "on-secondary-fixed": "#241a00",
        "on-secondary-fixed-variant": "#574500",

        // ── Tertiary ──
        tertiary: "#bfc8ce",
        "tertiary-container": "#515a5f",
        "tertiary-fixed": "#dbe4ea",
        "tertiary-fixed-dim": "#bfc8ce",
        "on-tertiary": "#293236",
        "on-tertiary-container": "#c8d1d7",
        "on-tertiary-fixed": "#141d21",
        "on-tertiary-fixed-variant": "#3f484d",

        // ── On-Surface ──
        "on-surface": "#dde3e9",
        "on-surface-variant": "#e0bfbc",
        "on-background": "#dde3e9",
        "inverse-surface": "#dde3e9",
        "inverse-on-surface": "#2b3136",

        // ── Error ──
        error: "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",

        // ── Outline ──
        outline: "#a78a87",
        "outline-variant": "#58413f",
      },
      fontFamily: {
        headline: ["var(--font-headline)", "Noto Serif", "serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
        label: ["var(--font-body)", "Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        sm: "0.125rem",
        md: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "fade-in-down": "fadeInDown 0.5s ease-out forwards",
        "slide-in-left": "slideInLeft 0.5s ease-out forwards",
        "slide-in-right": "slideInRight 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "pulse-danger": "pulseDanger 1.5s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "dice-roll": "diceRoll 0.6s ease-in-out",
        "border-glow": "borderGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        fadeInUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeInDown: { from: { opacity: "0", transform: "translateY(-12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideInLeft: { from: { opacity: "0", transform: "translateX(-20px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        slideInRight: { from: { opacity: "0", transform: "translateX(20px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.92)" }, to: { opacity: "1", transform: "scale(1)" } },
        pulseGlow: { "0%, 100%": { boxShadow: "0 0 15px rgba(233, 195, 73, 0.2)" }, "50%": { boxShadow: "0 0 30px rgba(233, 195, 73, 0.4)" } },
        pulseDanger: { "0%, 100%": { boxShadow: "0 0 10px rgba(255, 180, 171, 0.15)" }, "50%": { boxShadow: "0 0 25px rgba(255, 77, 77, 0.35)" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        diceRoll: { "0%": { transform: "rotate(0deg) scale(1)" }, "50%": { transform: "rotate(180deg) scale(1.1)" }, "100%": { transform: "rotate(360deg) scale(1)" } },
        borderGlow: { "0%, 100%": { borderColor: "rgba(233, 195, 73, 0.2)" }, "50%": { borderColor: "rgba(233, 195, 73, 0.5)" } },
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "700": "700ms",
      },
    },
  },
  plugins: [],
};

export default config;
