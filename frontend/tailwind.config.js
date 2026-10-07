/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        strand: {
          dark: '#0d1117',
          surface: '#161b22',
          border: '#30363d',
          accent: '#58a6ff',
          muted: '#8b949e',
        }
      }
    },
  },
  plugins: [],
}
