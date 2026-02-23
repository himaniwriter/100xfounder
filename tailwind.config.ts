import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        luxury: {
          bg: "#050505",
          text: "#EDEDED",
          violet: "#6366f1",
          glass: "rgb(255 255 255 / 0.05)",
          "glass-border": "rgb(255 255 255 / 0.10)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "slide-up": "slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backdropBlur: {
        md: "12px",
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            h1: {
              fontWeight: "700",
              letterSpacing: "-0.02em",
            },
            h2: {
              fontWeight: "650",
              letterSpacing: "-0.015em",
            },
            h3: {
              fontWeight: "600",
            },
            "h1, h2, h3, h4, h5, h6": {
              marginTop: "1.8em",
              marginBottom: "0.6em",
            },
            p: {
              marginTop: "1.1em",
              marginBottom: "1.1em",
            },
          },
        },
        invert: {
          css: {
            "--tw-prose-body": theme("colors.zinc.300"),
            "--tw-prose-headings": theme("colors.white"),
            "--tw-prose-links": theme("colors.indigo.300"),
            "--tw-prose-bold": theme("colors.zinc.100"),
            "--tw-prose-bullets": theme("colors.zinc.500"),
            "--tw-prose-hr": theme("colors.zinc.800"),
            "--tw-prose-quotes": theme("colors.zinc.200"),
            "--tw-prose-quote-borders": theme("colors.zinc.700"),
            "--tw-prose-code": theme("colors.zinc.100"),
            "--tw-prose-pre-bg": "rgba(255, 255, 255, 0.06)",
          },
        },
      }),
    },
  },
  plugins: [typography],
};

export default config;
