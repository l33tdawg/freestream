/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0d0d1a',
          light: 'rgba(255, 255, 255, 0.04)',
          lighter: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.12)',
        },
        accent: {
          DEFAULT: '#e94560',
          hover: '#ff6b81',
          glow: 'rgba(233, 69, 96, 0.25)',
          soft: 'rgba(233, 69, 96, 0.12)',
        },
        success: {
          DEFAULT: '#34d399',
          soft: 'rgba(52, 211, 153, 0.15)',
          glow: 'rgba(52, 211, 153, 0.3)',
        },
        warning: {
          DEFAULT: '#fbbf24',
          soft: 'rgba(251, 191, 36, 0.15)',
        },
        danger: {
          DEFAULT: '#f87171',
          soft: 'rgba(248, 113, 113, 0.15)',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.12)',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(233, 69, 96, 0.15)',
        'glow-lg': '0 0 40px rgba(233, 69, 96, 0.2)',
        'glow-success': '0 0 20px rgba(52, 211, 153, 0.2)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        card: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.05)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.08)',
        modal: '0 24px 80px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'live-dot': 'liveDot 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        liveDot: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.5, transform: 'scale(0.85)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
