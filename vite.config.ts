import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  build: {
    outDir: './build',
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, './src/api'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@os': path.resolve(__dirname, './src/os'),
    },
  },
});
