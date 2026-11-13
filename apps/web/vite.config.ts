import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { serviceWorker } from './serviceWorker.ts'

const api = 'http://localhost:3000'

export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorker()],
  server: {
    proxy: {
      '/api': { target: api, ws: true },
      '/audio': api,
      '/banners': api,
      '/auth': api,
    },
  },
})
