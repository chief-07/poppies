import type { Config } from "tailwindcss";

const config: Config = {
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
        poppy: {
          crimson: "#C24D36",
          dark: "#8D2817",
          light: "#E06B55",
        },
        paper: {
          DEFAULT: "#FBF9F5",
          warm: "#F5F2EB",
          dark: "#EFECE4",
        },
        ink: {
          DEFAULT: "#1C1B1A",
          muted: "#686663",
          light: "#9A9792",
        },
      },
      fontFamily: {
        serif: ["var(--font-frank-ruhl)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
