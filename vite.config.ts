import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { wallpaperCatalogPlugin } from './build/wallpaper-catalog-plugin.ts';

export default defineConfig({
  plugins: [wallpaperCatalogPlugin(), react()],
  base: './',
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  // Android 11 does not identify the installed WebView version. This is a
  // conservative compilation target, not a substitute for device testing.
  build: { target: 'chrome87', cssTarget: 'chrome87' },
});
