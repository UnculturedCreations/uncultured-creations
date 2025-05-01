import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config;
