import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#0066FF',
        base: '#121212',
        contrast: '#F0EBE1',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        heading: ['var(--font-space-grotesk)'],
      },
      keyframes: {
        fogDrift: {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(70px, -70px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        pulseScale: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.7)' },
        },
      },
      animation: {
        fog: 'fogDrift 7s ease-in-out infinite',
        pulse: 'pulseScale 50s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config;
