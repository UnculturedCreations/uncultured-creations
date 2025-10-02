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
        logoPulseScale: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
        bubbleFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.3' },
          '50%': { transform: 'translate(-100px, 70px) scale(1.5)', opacity: '0.6' },
        },
        cardSwing: {
          '0%, 100%': { transform: 'translateX(0)'},
          '50%': {transform: 'translateX(-5PX)'},
        },
      },
      animation: {
        fog: 'fogDrift 7s ease-in-out infinite',
        pulse: 'pulseScale 50s ease-in-out infinite',
        bubble1: 'bubbleFloat 15s ease-in-out infinite',
        bubble2: 'bubbleFloat 19s ease-in-out infinite',
        bubble3: 'bubbleFloat 17s ease-in-out infinite',
        bubble4: 'bubbleFloat 21s ease-in-out infinite',
        swing1: 'cardSwing 3s ease-in-out infinite',
        swing2: 'cardSwing 3.2s ease-in-out infinite',
        swing3: 'cardSwing 3.4s ease-in-out infinite',
        swing4: 'cardSwing 3.6s ease-in-out infinite',
        swing5: 'cardSwing 3.8s ease-in-out infinite',
        logoPulse: 'logoPulseScale 30s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config;
