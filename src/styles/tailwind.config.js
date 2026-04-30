/** @type {import('tailwindcss').Config} */
export default {
  // ── Content paths ─────────────────────────────────────────
  // Tailwind scans these files to purge unused CSS in production.
  // CRITICAL: If you add new file types, add them here.
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  // ── Dark mode ─────────────────────────────────────────────
  // 'class' strategy: dark mode is toggled by adding 'dark' class
  // to the <html> element (controlled via JavaScript).
  darkMode: 'class',

  theme: {
    extend: {
      // ── Aegis brand colors ───────────────────────────────
      colors: {
        aegis: {
          // Primary navy (main backgrounds)
          navy:    '#0a1628',
          'navy-light': '#0f2040',
          'navy-card':  '#112240',

          // Accent cyan (interactive elements, highlights)
          cyan:    '#00d4ff',
          'cyan-dim': '#00a8cc',

          // State colors
          success: '#00ff88',
          warning: '#ffaa00',
          danger:  '#ff4444',

          // Text
          'text-primary':   '#e8eaf6',
          'text-secondary': '#8892b0',
          'text-muted':     '#4a5568',
        },
      },

      // ── Custom fonts ─────────────────────────────────────
      fontFamily: {
        // Main UI font — clean, technical
        sans:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Display font — for headings and the Aegis logo
        mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      // ── Animations ───────────────────────────────────────
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':     'spin 4s linear infinite',
        'fade-in':       'fadeIn 0.3s ease-out',
        'slide-up':      'slideUp 0.4s ease-out',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px #00d4ff40' },
          '50%':      { boxShadow: '0 0 20px #00d4ff80, 0 0 40px #00d4ff40' },
        },
      },

      // ── Backdrop blur ────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
    },
  },

  plugins: [],
};
