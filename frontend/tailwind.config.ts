import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#B91C1C",
          redDark: "#7F1D1D",
          black: "#111111",
          gray: "#F7F7F7",
        },
      },
      fontFamily: {
        sans: ["var(--font-arabic)", "var(--font-latin)", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
