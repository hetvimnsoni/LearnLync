import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        accent: {
          amber: "#f59e0b",
          coral: "#f97316",
          emerald: "#10b981",
          violet: "#8b5cf6",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        "lumi-float": "lumiFloat 4.5s ease-in-out infinite",
        "lumi-wave": "lumiWave 1.8s ease-in-out infinite",
        "lumi-think": "lumiThink 3s ease-in-out infinite",
        "lumi-jump": "lumiJump 1.2s ease-in-out infinite",
        "lumi-listen": "lumiListen 2s ease-in-out infinite",
        "lumi-explain": "lumiExplain 3.5s ease-in-out infinite",
        "lumi-reassure": "lumiReassure 3s ease-in-out infinite",
        "lumi-read": "lumiRead 4s ease-in-out infinite",
        "lumi-scan": "lumiScan 2.5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        lumiFloat: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-7px) rotate(1.5deg)" },
        },
        lumiWave: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "25%": { transform: "translateY(-5px) rotate(4deg)" },
          "75%": { transform: "translateY(-2px) rotate(-3deg)" },
        },
        lumiThink: {
          "0%, 100%": { transform: "translateY(-3px) rotate(-3deg)" },
          "50%": { transform: "translateY(-7px) rotate(-4.5deg)" },
        },
        lumiJump: {
          "0%, 100%": { transform: "translateY(0px) scale(1.05)" },
          "40%": { transform: "translateY(-14px) scale(1.12)" },
          "60%": { transform: "translateY(-10px) scale(1.08)" },
        },
        lumiListen: {
          "0%, 100%": { transform: "scale(1.02)" },
          "50%": { transform: "scale(1.06)" },
        },
        lumiExplain: {
          "0%, 100%": { transform: "rotate(0deg) translateY(0)" },
          "33%": { transform: "rotate(2.5deg) translateY(-4px)" },
          "66%": { transform: "rotate(-2deg) translateY(-2px)" },
        },
        lumiReassure: {
          "0%, 100%": { transform: "rotate(2deg) translateY(0)" },
          "50%": { transform: "rotate(3.5deg) translateY(-3px)" },
        },
        lumiRead: {
          "0%, 100%": { transform: "translateY(2px) rotate(1deg)" },
          "50%": { transform: "translateY(5px) rotate(0deg)" },
        },
        lumiScan: {
          "0%, 100%": { transform: "translateY(-2px) scale(1.02)" },
          "50%": { transform: "translateY(-5px) scale(1.04)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
