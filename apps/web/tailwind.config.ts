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
    },
  },
  plugins: [],
};

export default config;
