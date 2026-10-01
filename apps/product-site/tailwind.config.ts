import type { Config } from 'tailwindcss';
import sharedConfig from '../../packages/shared-ui/tailwind.config';

export default {
  presets: [sharedConfig],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared-ui/src/**/*.{js,ts,jsx,tsx}'
  ],
} satisfies Config;