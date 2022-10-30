import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: './build',
  },
  resolve: {
    alias: {
      '#api': path.resolve(__dirname, './src/api'),
      '#ui': path.resolve(__dirname, './src/ui'),
    },
  },
});
