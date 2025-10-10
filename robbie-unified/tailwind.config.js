/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'robbie': {
          'accent': '#FF6B9D',
          'cyan': '#00D9FF',
          'purple': '#B794F6',
          'dark': '#0A0E27',
          'darker': '#060918',
          'card': '#1A1F3A',
          'green': '#10B981',
          'orange': '#F59E0B',
          'red': '#EF4444',
          'light': '#E5E7EB',
          'muted': '#9CA3AF',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'matrix-fall': 'matrix-fall linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'matrix-fall': {
          '0%': { top: '-100%', opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}





