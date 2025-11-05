/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enables Tailwind's dark mode using the 'dark' class
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar'), // 👈 Add this line
  ],
}
