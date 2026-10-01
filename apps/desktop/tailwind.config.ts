// apps/desktop/tailwind.config.ts
import type { Config } from 'tailwindcss';
import sharedConfig from '../../packages/shared-ui/tailwind.config';
import animate from 'tailwindcss-animate';
import forms from '@tailwindcss/forms';

export default {
  presets: [sharedConfig],
  // We define the specific content paths relative to apps/desktop
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/shared-ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  // We load the plugins here, where they are actually installed!
  plugins: [animate, forms],
} satisfies Config;