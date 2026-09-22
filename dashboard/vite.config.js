import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Deployed behind the public site's domain at /admin (see ../vercel.json's rewrite + src/app/App.jsx's
  // `basename`) — every asset URL must carry that prefix, so the browser (whose address bar shows the main
  // site's origin) requests /admin/assets/... instead of /assets/....
  base: '/admin/',
  resolve: {
    // `@/ui`, `@/lib/api`, `@/i18n`… resolve from src/ (mirrored in jsconfig.json for editors)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // every feature is bundled eagerly (see docs/UI-KIT.md, known limits) — silence the 500 kB advisory until it matters
  build: { chunkSizeWarningLimit: 900 },
  server: {
    port: 5174,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
