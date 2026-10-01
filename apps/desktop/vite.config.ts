import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true
  },
  // THE FIX: Tells the app to load files locally instead of from a web server
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});