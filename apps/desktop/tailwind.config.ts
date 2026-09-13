// apps/desktop/tailwind.config.ts
import type { Config } from 'tailwindcss';
import sharedConfig from '../../packages/shared-ui/tailwind.config';
import animate from 'tailwindcss-animate';
import forms from '@tailwindcss/forms';

export default {
  presets: [sharedConfig],
  // We explicitly tell this local file to use the shared content paths
  content: sharedConfig.content,
  // We load the plugins here, where they are actually installed!
  plugins: [animate, forms],
} satisfies Config;