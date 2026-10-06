/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        malon: {
          bg: "#0B0B0C",
          card: "#161619",
          surface: "#222227",
          red: "#B91C1C",
          "red-hover": "#991B1B",
          sand: "#C99E70",
          "sand-hover": "#B38B5E",
          white: "#FFFFFF",
          muted: "#8E8E93",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
