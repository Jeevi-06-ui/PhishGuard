import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          main: 'rgb(var(--bg-main-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary-rgb) / <alpha-value>)',
          card: 'var(--bg-card)',
          elevated: 'rgb(var(--bg-elevated-rgb) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
          muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        },
        accent: {
          primary: 'rgb(var(--accent-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary-rgb) / <alpha-value>)',
        },
        status: {
          success: '#22C55E',
          danger: '#EF4444',
          warning: '#F59E0B',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px -6px var(--glow-primary)',
        'glow-violet': '0 0 24px -6px var(--glow-secondary)',
        card: 'var(--shadow-card)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        scanline: 'scanline 3s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
