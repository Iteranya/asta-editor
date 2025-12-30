// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // 1. Add this 'define' block to fix the "process is not defined" error
  define: {
    'process.env.NODE_ENV': '"production"' 
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'AstaMilkdown', // This becomes window.AstaMilkdown
      fileName: (format) => `asta-bundle.${format}.js`,
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'asta-editor.css';
          return assetInfo.name;
        },
      },
    },
  },
});