/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  darkMode: 'class',
  theme: {
    extend: {
      // Core Color Palette
      colors: {
        // Core palette
        'ink-black': '#0B0C0E',
        'graphite': '#14171B',
        'slate': '#232830',
        'steel': '#8C96A8',
        'cloud': '#F2F4F7',
        'signal-lime': '#C6FF3D',
        'electric-teal': '#17E9C2',
        'sky': '#4DB1FF',
        'amber': '#FFB020',
        'scarlet': '#FF5A5A',
        
        // Semantic tokens - Dark (primary)
        'bg-base': '#0B0C0E',
        'bg-surface': '#14171B',
        'bg-elevated': '#232830',
        'text-primary': '#E9EEF9',
        'text-secondary': '#A5B2C8',
        'text-muted': '#8C96A8',
        'border-subtle': '#2B2F36',
        'border-strong': '#3A414D',
        'accent-brand': '#C6FF3D',
        'accent-brand-hover': '#B3F232',
        'accent-brand-pressed': '#98D82B',
        'focus-ring': 'rgba(198,255,61,0.45)',
        'success': '#17E9C2',
        'info': '#4DB1FF',
        'warning': '#FFB020',
        'danger': '#FF5A5A',
        'selection': 'rgba(198,255,61,0.12)',
        'scrim': 'rgba(0,0,0,0.55)',
        
        // Light variant (fallback)
        'bg-base-light': '#FFFFFF',
        'bg-surface-light': '#F5F7FA',
        'bg-elevated-light': '#FFFFFF',
        'text-primary-light': '#0B0C0E',
        'text-secondary-light': '#3B4453',
        'text-muted-light': '#6B7280',
        'border-subtle-light': '#E4E7EC',
        'border-strong-light': '#CDD5DF',
        'accent-brand-light': '#3A4D00',
        
        // Graph canvas
        'graph-grid': '#1C222A',
        'node-cookie': '#1A1F26',
      },
      
      // Typography
      fontFamily: {
        'sans': ['Geist', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      
      fontSize: {
        'h1': ['36px', { lineHeight: '42px', letterSpacing: '-0.01em' }],
        'h2': ['28px', { lineHeight: '34px' }],
        'h3': ['22px', { lineHeight: '28px' }],
        'body': ['16px', { lineHeight: '24px' }],
        'small': ['14px', { lineHeight: '20px' }],
        'code-sm': ['12px', { lineHeight: '18px' }],
        'code': ['13px', { lineHeight: '20px' }],
        'code-lg': ['14px', { lineHeight: '22px' }],
      },
      
      // 4-pt Spacing Scale
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
        
        // Page gutters
        'gutter-mobile': '24px',
        'gutter-tablet': '32px',
        'gutter-desktop': '48px',
        
        // Three-pane layout
        'capture-min': '320px',
        'capture-max': '360px',
        'spec-min': '420px',
        'spec-max': '480px',
      },
      
      // Border Radius
      borderRadius: {
        'input': '10px',
        'button': '12px',
        'card': '16px',
        'modal': '20px',
        'pill': '999px',
      },
      
      // Custom Shadows
      boxShadow: {
        'level-1': '0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.35)',
        'level-2': '0 6px 24px rgba(0,0,0,0.45)',
        'accent-glow': '0 0 0 2px rgba(198,255,61,0.35), 0 0 24px rgba(198,255,61,0.35)',
        'focus': '0 0 0 2px rgba(198,255,61,0.45), 0 0 6px rgba(198,255,61,0.35)',
      },
      
      // Animation & Motion
      transitionDuration: {
        'micro': '90ms',
        'default': '180ms',
        'overlay': '260ms',
        'shimmer': '900ms',
      },
      
      transitionTimingFunction: {
        'swift': 'cubic-bezier(.2,.8,.2,1)',
      },
      
      // Keyframes for shimmer effect
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'trace-backwards': {
          '0%': { opacity: '0.3', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      
      animation: {
        'shimmer': 'shimmer 900ms ease-in-out infinite',
        'fade-in': 'fade-in 180ms cubic-bezier(.2,.8,.2,1)',
        'trace-backwards': 'trace-backwards 260ms cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
