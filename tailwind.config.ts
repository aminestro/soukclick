import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Enforce minimum 375px — anything below is not supported
        xs: "375px",
      },
      colors: {
        brand: {
          DEFAULT: "#f97316",  // orange-500
          dark:    "#ea580c",  // orange-600
        },
      },
    },
  },
  plugins: [],
}

export default config
