import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { rmSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'dist');

// 1. Clean dist/
rmSync(outDir, { recursive: true, force: true });

// 2. Content script — IIFE (content script는 ES module import 불가)
console.log('\n[1/2] Building content script (IIFE)...');
await build({
  configFile: false,
  root,
  build: {
    outDir,
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input: { 'content/inject': resolve(root, 'src/content/inject.ts') },
      output: {
        format: 'iife',
        entryFileNames: '[name].js',
      },
    },
  },
});

// 3. Background + Popup — ESM (service worker "type":"module", popup <script type="module">)
console.log('\n[2/2] Building background + popup (ESM)...');
await build({
  configFile: resolve(root, 'vite.config.ts'),
  root,
});

console.log('\nBuild complete.');
