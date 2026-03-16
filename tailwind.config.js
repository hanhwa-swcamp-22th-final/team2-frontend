/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F172A',
        mist: '#E2E8F0',
        brand: '#0F766E',
        sand: '#F7F3EC',
        ember: '#C2410C',
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 18px 40px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
