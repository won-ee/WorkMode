// vite.config.ts — ESM 빌드 전용 (background + popup)
// content script는 scripts/build.mjs에서 별도 IIFE 빌드
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'popup/popup': resolve(__dirname, 'src/popup/popup.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'src/manifest.json', dest: '.' },
        { src: 'src/content/styles/*.css', dest: 'content/styles' },
        { src: 'src/popup/popup.html', dest: 'popup' },
        { src: 'src/popup/popup.css', dest: 'popup' },
        { src: 'src/icons/icon-*.png', dest: 'icons' },
      ],
    }),
  ],
});
