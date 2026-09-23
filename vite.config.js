import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_DEV_PROXY_TARGET (set in a local, gitignored .env.local) lets a single developer point their dev
// server at a different backend — e.g. the live production API — without touching this shared file.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: { proxy: { '/api': { target: env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000', changeOrigin: true } } },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
      // `dashboard/` is its own Vite project (own vitest config, own `@` alias) nested in this repo —
      // without this it's picked up by this project's default test glob and fails to resolve its imports.
      exclude: ['**/node_modules/**', '**/dist/**', '**/dashboard/**'],
    },
  }
})
