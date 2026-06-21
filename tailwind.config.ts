import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        // Surfaces & borders (UI_SPEC §2.1)
        background: "#16181C",
        surface: "#1E2026",
        "surface-elevated": "#22252C",
        border: "#2C2F38",

        // Text
        "text-primary": "#F2F3F5",
        "text-body": "#D8DAE0",
        "text-secondary": "#8B8F98",
        "text-secondary-strong": "#9A9DA6",
        "text-tertiary": "#6E7280",
        "myanmar-text": "#C99A82",

        // Mint (success / correction)
        mint: "#5EE39B",
        "mint-dark": "#3DDC84",
        "mint-on": "#0A1A12",
        "mood-bg": "#1F3D2E",

        // Coral (error / attention)
        coral: "#FF6B4A",
        "coral-light": "#FF8A6E",
        "mistake-bg": "#3D2218",

        // Suggestion card
        "suggestion-bg": "#142420",
        "suggestion-border": "#234032",

        // shadcn primitives — kept so existing UI components keep compiling.
        // Values map onto the new dark palette via globals.css :root vars.
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: "var(--destructive)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
