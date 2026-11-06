import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: 'rgb(var(--c-bg) / <alpha-value>)',
        navy: 'rgb(var(--c-bg2) / <alpha-value>)',
        sys: 'rgb(var(--c-primary) / <alpha-value>)',
        arcane: 'rgb(var(--c-secondary) / <alpha-value>)',
        ember: 'rgb(var(--c-accent) / <alpha-value>)',
        glow: 'rgb(var(--c-text) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Orbitron"', 'sans-serif'],
        body: ['"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        holo: '0 0 0 1px rgb(var(--c-primary) / 0.35), 0 0 24px rgb(var(--c-primary) / 0.18), inset 0 0 32px rgb(var(--c-primary) / 0.06)',
        arcane: '0 0 0 1px rgb(var(--c-secondary) / 0.4), 0 0 28px rgb(var(--c-secondary) / 0.25)',
        ember: '0 0 0 1px rgb(var(--c-accent) / 0.5), 0 0 28px rgb(var(--c-accent) / 0.3)',
      },
      keyframes: {
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        pulseGlow: { '0%,100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        spinRev: { to: { transform: 'rotate(-360deg)' } },
        flicker: { '0%,100%': { opacity: '1' }, '92%': { opacity: '1' }, '93%': { opacity: '0.4' }, '94%': { opacity: '1' }, '97%': { opacity: '0.6' } },
        rise: { '0%': { transform: 'translateY(0) scale(1)', opacity: '0' }, '20%': { opacity: '1' }, '100%': { transform: 'translateY(-120px) scale(0.3)', opacity: '0' } },
      },
      animation: {
        scan: 'scan 7s linear infinite',
        pulseGlow: 'pulseGlow 2.6s ease-in-out infinite',
        spinSlow: 'spinSlow 24s linear infinite',
        spinRev: 'spinRev 36s linear infinite',
        flicker: 'flicker 6s linear infinite',
        rise: 'rise 3s ease-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
