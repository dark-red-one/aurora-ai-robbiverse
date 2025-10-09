import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        lib: {
            entry: 'src/webview/RobbieBar.tsx',
            name: 'RobbieBar',
            fileName: 'robbie-bar',
            formats: ['iife']
        },
        rollupOptions: {
            output: {
                entryFileNames: 'robbie-bar.js'
            }
        }
    }
});


