/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx}', './screens/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#17243A',
        canvas: '#F7F9FC',
        card: '#FFFFFF',
        line: '#E2E8F0',
        muted: '#66748B',
        crimson: '#173B70',
        royal: '#3265A8',
      },
    },
  },
  plugins: [],
};
