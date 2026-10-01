// @ts-nocheck
// packages/shared-ui/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', "[data-theme='dark']"],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../apps/**/*.{js,ts,jsx,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          panel: 'var(--glass-panel)',
          panelBorder: 'var(--glass-panel-border)',
          input: 'var(--glass-input)',
          inputBorder: 'var(--glass-input-border)',
        },
        app: {
          text: 'var(--text-main)',
          muted: 'var(--text-muted)',
          from: 'var(--app-grad-from)',
          via: 'var(--app-grad-via)',
          to: 'var(--app-grad-to)',
        },
        primary: {
          DEFAULT: '#059669', dark: '#047857', deep: '#064E3B',
          mid: '#10B981', light: '#34D399', pale: '#D1FAE5',
          ghost: '#ECFDF5', foreground: '#FFFFFF',
        },
        // Playbook §D-13.1 Status Colors
        secondary: '#0D9488',
        error: '#DC2626',
        warning: '#D97706',
        
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        border: 'hsl(var(--border))',
      },
      keyframes: {
        'iris-pulse': { 
          '0%,100%': { boxShadow: '0 0 8px 2px rgba(5,150,105,0.4)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(5,150,105,0.8)' } 
        }
      },
      animation: {
        'iris-pulse': 'iris-pulse 2s ease-in-out infinite',
      },
    },
  },
};

export default config;