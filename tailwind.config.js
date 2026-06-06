/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#FEF3C7', // amber-50
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D', // amber-300
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309', // amber-700
          800: '#92400E', // amber-800
          900: '#78350F',
        },
        primary: {
          50: '#FEF3C7',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

