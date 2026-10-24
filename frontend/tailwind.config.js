/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wind: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        slate: {
          850: '#151e2e',
          925: '#06091a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'orb-drift': 'orb-drift 20s ease-in-out infinite alternate',
        'orb-drift-2': 'orb-drift 28s ease-in-out infinite alternate-reverse',
        'orb-drift-3': 'orb-drift 35s ease-in-out infinite alternate',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out both',
      },
      keyframes: {
        'orb-drift': {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(4%, 6%) scale(1.08)' },
          '66%': { transform: 'translate(-3%, 3%) scale(0.95)' },
          '100%': { transform: 'translate(2%, -4%) scale(1.04)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backdropBlur: {
        xs: '4px',
      },
      boxShadow: {
        'card-dark': '0 4px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(56,189,248,0.08) inset',
        'card-light': '0 4px 24px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        'glow-sky': '0 0 30px rgba(56,189,248,0.25)',
        'glow-indigo': '0 0 30px rgba(129,140,248,0.25)',
      },
    },
  },
  plugins: [],
}
