/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Matrix theme
        'matrix-green': '#00ff41',
        'matrix-dark': '#008f11',
        'matrix-dim': '#003b00',
        
        // Robbie colors
        'robbie-purple': '#9d4edd',
        'robbie-pink': '#ff006e',
        'robbie-blue': '#00b4d8',
        'robbie-orange': '#ff9e00',
        
        // Background
        'bg-dark': '#0d0208',
        'bg-darker': '#000000',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'matrix-fall': 'matrix-fall 20s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(157, 78, 221, 0.5)',
            filter: 'brightness(1)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(157, 78, 221, 0.8)',
            filter: 'brightness(1.2)',
          },
        },
        'matrix-fall': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
