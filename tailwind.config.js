/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx}', './screens/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0D',
        card: '#17171B',
        line: '#2A2A30',
        muted: '#9CA3AF',
        crimson: '#D91E2A',
        royal: '#1D4ED8',
      },
    },
  },
  plugins: [],
};
