import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#f2f6fc",
          100: "#e3ebf7",
          200: "#b0c6e5",
          300: "#8fb0da",
          400: "#5f92c9",
          500: "#3f78b8",
          600: "#2f5f9c",
          700: "#254c7d",
          800: "#1c3a60",
          900: "#142a47",
        },
      },
    },
  },
  plugins: [],
};

export default config;