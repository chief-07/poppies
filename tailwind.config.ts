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
          green: "#28402a",
          greenDark: "#1f3321",
          crimson: "#C24D36",
          dark: "#8D2817",
          light: "#E06B55",
        },
        paper: {
          DEFAULT: "#F7F7D9",
          warm: "#F5F2EB",
          dark: "#EFECE4",
        },
        ink: {
          DEFAULT: "#28402a",
          muted: "#556b57",
          light: "#829984",
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
