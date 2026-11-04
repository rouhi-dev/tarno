import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base so the build can be served from any sub-path (GitHub Pages,
  // static hosts, or a file:// preview) without rewriting asset URLs.
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
