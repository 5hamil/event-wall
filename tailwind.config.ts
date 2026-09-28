import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-dark": "var(--accent-dark)",
        surface: "var(--surface)",
        border: "var(--border)",
      },
      borderRadius: { card: "10px" },
      boxShadow: {
        subtle: "0 8px 28px rgba(28, 24, 52, 0.06)",
        lift: "0 14px 36px rgba(28, 24, 52, 0.1)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
