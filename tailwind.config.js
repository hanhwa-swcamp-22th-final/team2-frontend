/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F172A',
        mist: '#E2E8F0',
        brand: {
          DEFAULT: '#0A6ED1',
          100: '#EAF2FB',
          200: '#CFE2F6',
          500: '#0A6ED1',
          600: '#0859A8',
          700: '#074A8C',
        },
        sand: '#F7F3EC',
        ember: '#C2410C',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Noto Sans KR', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 18px 40px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
