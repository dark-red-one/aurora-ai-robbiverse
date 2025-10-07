/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        robbie: {
          bg: {
            primary: '#0a0a18',
            secondary: '#0d1117',
            card: '#1a1a2e',
          },
          cyan: '#00d4ff',
          green: '#4caf50',
          pink: '#ff6b9d',
          orange: '#ff6b35',
          teal: '#4ecdc4',
          matrix: {
            orange: '#ff6b35',
            teal: '#4ecdc4',
            pink: '#ff6b9d',
          },
          notes: {
            yellow: '#ffd93d',
            green: '#6bcf7f',
            blue: '#6fa8dc',
            red: '#ff6b6b',
            purple: '#c38fff',
            orange: '#ff9f43',
          }
        }
      },
      fontFamily: {
        'sans': ['Poppins', 'system-ui', 'sans-serif'],
        'mono': ['"Courier New"', 'monospace'],
      },
      animation: {
        'matrix-fall': 'matrixFall linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        matrixFall: {
          '0%': { transform: 'translateY(-100%)', opacity: '0.3' },
          '50%': { opacity: '0.6' },
          '100%': { transform: 'translateY(100vh)', opacity: '0.1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
