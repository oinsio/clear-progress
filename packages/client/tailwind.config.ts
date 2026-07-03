import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "draw-check": {
          "0%": { strokeDashoffset: "20" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "draw-check": "draw-check 0.3s ease forwards",
      },
      colors: {
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        green: {
          50: "#EBF6E3",
          100: "#D2ECBF",
          200: "#B3E094",
          300: "#94D566",
          400: "#78CA3E",
          500: "#69B23E",
          600: "#5EA038",
          700: "#416B23",
          800: "#33531D",
          900: "#253B16",
          950: "#17240E",
        },
      },
    },
  },
  plugins: [
    animate,
    typography,
    plugin(({ addVariant }) => {
      addVariant("pointer-fine", "@media (pointer: fine)");
    }),
  ],
};

export default config;
