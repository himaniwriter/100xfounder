import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#030303",
        glass: "rgba(255, 255, 255, 0.05)",
        border: "rgba(255, 255, 255, 0.10)",
        "border-soft": "rgba(255, 255, 255, 0.05)",
        glow: {
          purple: "rgba(124, 58, 237, 0.35)",
          blue: "rgba(59, 130, 246, 0.30)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 50px rgba(124, 58, 237, 0.25)",
      },
      backdropBlur: {
        xl: "24px",
        "2xl": "40px",
      },
    },
  },
  plugins: [],
};

export default config;
