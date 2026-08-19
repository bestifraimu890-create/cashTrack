/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ['"Space Grotesk"', "Inter", "sans-serif"],
      },
      colors: {
        // Primary brand — "ink violet". Used for chrome: buttons, nav, logo, primary charts.
        brand: {
          50: "#F1EEFC",
          100: "#E1D9F7",
          200: "#C7BAEF",
          300: "#A896E3",
          400: "#8A72D1",
          500: "#6F55BE",
          600: "#5B3FA8",
          700: "#472F87",
          800: "#35226A",
          900: "#1F1548",
        },
        // Accent — "cowrie gold". Secondary highlights, secondary chart series.
        gold: {
          50: "#FDF6E9",
          100: "#FAEACA",
          200: "#F3D896",
          300: "#E9C066",
          400: "#DDA83E",
          500: "#C68F27",
          600: "#B07A1E",
          700: "#8C611A",
          800: "#674811",
          900: "#47320B",
        },
        // Semantic positive/money-in color — kept distinct from brand chrome.
        mint: {
          50: "#EAFBF3",
          100: "#CFF5E3",
          200: "#9FE9C8",
          300: "#6BD8AA",
          400: "#3EC28D",
          500: "#22A874",
          600: "#128A5D",
          700: "#0E6E4A",
          800: "#0B5539",
          900: "#073B28",
        },
        paper: "#F8F6F2",
        ink: "#1A1425",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(31, 21, 72, 0.04), 0 1px 3px 0 rgba(31, 21, 72, 0.06)",
        soft: "0 8px 24px -8px rgba(31, 21, 72, 0.18)",
      },
    },
  },
  plugins: [],
};
