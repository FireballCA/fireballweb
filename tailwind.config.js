/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: '#0a0a0a',
          900: '#111111',
          800: '#1a1a1a',
          700: '#252525',
          600: '#333333',
          500: '#404040',
        },
        chrome: '#c9b896',
        silver: '#e5e5e5',
        pearl: '#f5f5f0',
        apex: '#E23854',
      },
      fontFamily: {
        display: ['Bebas Neue', 'Oswald', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        nav: ['HKG Wide', 'Hanken Grotesk', 'sans-serif'],
      },
      letterSpacing: {
        'luxury': '0.2em',
        'wide': '0.35em',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
