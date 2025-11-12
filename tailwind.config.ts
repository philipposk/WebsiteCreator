import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        playfair: ["var(--font-playfair)", "serif"],
        bebas: ["var(--font-bebas)", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "sans-serif"],
        calligraphic: ["var(--font-kalam)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
