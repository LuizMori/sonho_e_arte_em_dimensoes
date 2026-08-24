import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1320px",
      },
    },
    extend: {
      colors: {
        navy: {
          DEFAULT: "#2A254C",
          deep: "#101127",
        },
        purple: {
          DEFAULT: "#513A73",
        },
        magenta: {
          DEFAULT: "#C94971",
        },
        orange: {
          DEFAULT: "#E8792F",
          terracotta: "#97371C",
        },
        cream: {
          DEFAULT: "#F1E9E6",
          light: "#F8F3F1",
        },
        neutral: {
          DEFAULT: "#96908C",
          light: "#D8D0CC",
        },
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.03em",
        label: "0.18em",
      },
      transitionTimingFunction: {
        "ease-out-soft": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
