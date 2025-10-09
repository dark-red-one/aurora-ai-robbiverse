import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/webview/App.tsx',
      name: 'RobbieWebview',
      fileName: 'webview',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'webview.js'
      }
    }
  }
});

