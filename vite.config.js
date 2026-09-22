import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // `dashboard/` is its own Vite project (own vitest config, own `@` alias) nested in this repo —
    // without this it's picked up by this project's default test glob and fails to resolve its imports.
    exclude: ['**/node_modules/**', '**/dist/**', '**/dashboard/**'],
  },
})
