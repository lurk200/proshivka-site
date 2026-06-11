import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { repairPriceApiPlugin } from './vite-plugins/repairPriceApi.js'
import { ordersApiPlugin } from './vite-plugins/ordersApi.js'
import { cmsApiPlugin } from './vite-plugins/cmsApi.js'
import { analyticsApiPlugin } from './vite-plugins/analyticsApi.js'
import { settingsApiPlugin } from './vite-plugins/settingsApi.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    repairPriceApiPlugin(),
    ordersApiPlugin(),
    cmsApiPlugin(),
    analyticsApiPlugin(),
    settingsApiPlugin(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
})
