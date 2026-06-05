/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d5fd',
          300: '#a5b8fb',
          400: '#8093f8',
          500: '#6272f2',
          600: '#4f54e5',
          700: '#4142ca',
          800: '#3637a3',
          900: '#303481',
          950: '#1e1f4c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

