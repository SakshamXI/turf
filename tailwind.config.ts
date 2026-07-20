import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#1B4332",
        pitchDark: "#0E2B22",
        floodlight: "#F2A93B",
        cream: "#F7F5EF",
        chalk: "#FFFFFF",
        line: "#2D6A4F",
        warning: "#B3452E",
        warningBg: "#FBEAE5",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        floatMessage: {
          "0%": { left: "100%", opacity: "0" },
          "8%": { opacity: "1" },
          "92%": { opacity: "1" },
          "100%": { left: "-100%", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease-out both",
        "fade-in": "fadeIn 0.4s ease-out both",
        "scale-in": "scaleIn 0.2s ease-out both",
        "float-message": "floatMessage 6s ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
