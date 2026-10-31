import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'lightningcss': path.resolve(__dirname, 'src/utils/lightningcss-stub.js'),
        '../lightningcss.win32-x64-msvc.node': path.resolve(__dirname, 'src/utils/lightningcss-stub.js'),
      },
    },
    css: {
      transformer: 'postcss' as const,
    },
    build: {
      cssMinify: 'esbuild' as const,
      rollupOptions: {
        external: [
          '@rollup/rollup-win32-x64-msvc',
          '@rollup/rollup-win32-arm64-msvc',
          '@rollup/rollup-win32-ia32-msvc',
          '@rollup/rollup-linux-x64-gnu',
          '@rollup/rollup-darwin-x64',
          '@rollup/rollup-darwin-arm64',
          'lightningcss-win32-x64-msvc',
          '../lightningcss.win32-x64-msvc.node',
        ],
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
