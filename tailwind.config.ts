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
        surface: {
          DEFAULT: "hsl(var(--surface))",
          elevated: "hsl(var(--surface-elevated))",
          overlay: "hsl(var(--surface-overlay))",
        },
      },
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "22": "5.5rem",
      },
      fontSize: {
        "display": ["3.5rem", { lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "700" }],
        "heading-1": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "700" }],
        "heading-2": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "650" }],
        "heading-3": ["1.25rem", { lineHeight: "1.35", letterSpacing: "-0.015em", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.8", fontWeight: "400" }],
        "body": ["0.9375rem", { lineHeight: "1.7", fontWeight: "400" }],
        "caption": ["0.8125rem", { lineHeight: "1.5", fontWeight: "400" }],
        "overline": ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "500" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "card": "14px",
        "button": "10px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        "card": "0 1px 2px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 2px 4px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15)",
        "elevated": "0 4px 12px rgba(0, 0, 0, 0.2), 0 16px 40px rgba(0, 0, 0, 0.15)",
        "glow-indigo": "0 0 20px rgba(99, 102, 241, 0.15), 0 0 40px rgba(99, 102, 241, 0.05)",
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
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-bottom": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "slide-up": "slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-up": "fade-in-up 500ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-bottom": "slide-in-bottom 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backdropBlur: {
        md: "12px",
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.zinc.300"),
            "--tw-prose-headings": "#ffffff",
            "--tw-prose-links": theme("colors.indigo.300"),
            "--tw-prose-bold": theme("colors.zinc.100"),
            "--tw-prose-bullets": theme("colors.zinc.500"),
            "--tw-prose-hr": theme("colors.zinc.800"),
            "--tw-prose-quotes": theme("colors.zinc.200"),
            "--tw-prose-quote-borders": "rgba(99, 102, 241, 0.35)",
            "--tw-prose-code": theme("colors.zinc.100"),
            "--tw-prose-pre-bg": "rgba(255, 255, 255, 0.04)",
            fontSize: "18px",
            lineHeight: "1.8",
            maxWidth: "720px",
            h1: {
              fontWeight: "700",
              letterSpacing: "-0.025em",
              fontSize: "2rem",
              marginTop: "2.5em",
              marginBottom: "0.75em",
            },
            h2: {
              fontWeight: "650",
              letterSpacing: "-0.02em",
              fontSize: "1.6rem",
              marginTop: "2em",
              marginBottom: "0.6em",
            },
            h3: {
              fontWeight: "600",
              letterSpacing: "-0.015em",
              fontSize: "1.3rem",
              marginTop: "1.8em",
              marginBottom: "0.5em",
            },
            h4: {
              fontWeight: "600",
              fontSize: "1.1rem",
              marginTop: "1.5em",
              marginBottom: "0.4em",
            },
            p: {
              marginTop: "1.2em",
              marginBottom: "1.2em",
            },
            a: {
              textDecorationThickness: "1px",
              textUnderlineOffset: "2px",
              transition: "color 150ms ease",
            },
            blockquote: {
              borderLeftWidth: "3px",
              fontStyle: "italic",
            },
            code: {
              background: "rgba(255, 255, 255, 0.06)",
              borderRadius: "4px",
              padding: "0.15em 0.4em",
              fontWeight: "400",
            },
            "code::before": {
              content: "none",
            },
            "code::after": {
              content: "none",
            },
            pre: {
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
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
            "--tw-prose-quote-borders": "rgba(99, 102, 241, 0.35)",
            "--tw-prose-code": theme("colors.zinc.100"),
            "--tw-prose-pre-bg": "rgba(255, 255, 255, 0.04)",
          },
        },
      }),
    },
  },
  plugins: [typography],
};

export default config;
