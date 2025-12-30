import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    ssr: true,
    target: 'node20',
    outDir: 'server/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'server/src/index.ts',
      output: {
        format: 'esm',
        entryFileNames: '[name].js',
      },
      // Externalize dependencies to keep the bundle size small and avoid bundling node_modules
      external: [
        'express',
        'cors',
        'dotenv',
        'path',
        'fs',
        'url',
        'http'
      ]
    }
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain')
    }
  }
});
