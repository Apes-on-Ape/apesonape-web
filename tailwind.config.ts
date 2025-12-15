import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        'background-elevated': "var(--background-elevated)",
        'background-surface': "var(--background-surface)",
        foreground: "var(--foreground)",
        // Apechain blue theme
        'hero-blue': {
          DEFAULT: '#0054F9',
          light: '#3377FF',
          dark: '#0041C4',
        },
        'ape-gold': {
          DEFAULT: '#FFD700',
          light: '#FFE44D',
          dark: '#CCB000',
        },
        'ape-darker': '#1a1a1a',
        'ape-gray': {
          DEFAULT: '#8B9DC3',
          light: '#B8C5DC',
          dark: '#5E729A',
        },
        // Premium accent colors
        'accent-cyan': '#00D9FF',
        'accent-purple': '#8B5CF6',
        'accent-pink': '#EC4899',
        'accent-green': '#10B981',
        // Card & border
        'card-bg': 'var(--card-bg)',
        'border-color': 'var(--border-color)',
        'border-color-hover': 'var(--border-color-hover)',
        'border-color-active': 'var(--border-color-active)',
      },
      fontFamily: {
        'sans': ['Raleway', 'system-ui', 'sans-serif'],
        'mono': ['monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grain': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'tilt': 'tilt 10s infinite linear',
        'magnetic': 'magnetic 0.3s ease-out',
        'stagger': 'stagger 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)' },
        },
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        magnetic: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        stagger: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 84, 249, 0.4)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config;

