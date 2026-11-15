/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B14',
          900: '#0B1120',
          850: '#0F172A',
          800: '#152033',
          700: '#1E293B',
          600: '#334155',
        },
        brand: {
          teal: '#0D9488',
          cyan: '#06B6D4',
          lightTeal: '#14B8A6',
          darkTeal: '#115E59'
        }
      }
    },
  },
  plugins: [],
}
