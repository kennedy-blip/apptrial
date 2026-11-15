/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'ping-opacity': 'ping-opacity 0.75s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'ping-opacity': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
      },
      colors: {
        indigo: {
          500: '#6366f1',
          600: '#4f46e5',
        },
      },
    },
  },
  plugins: [],
}
