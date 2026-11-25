import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cmsApiPlugin } from './vite-plugins/cmsApi.js'
import { crmApiPlugin } from './vite-plugins/crmApi.js'
import { calculatorApiPlugin } from './vite-plugins/calculatorApi.js'
import { backupApiPlugin } from './vite-plugins/backupApi.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cmsApiPlugin(),
    crmApiPlugin(),
    calculatorApiPlugin(),
    backupApiPlugin(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5174,
  },
  preview: {
    host: '127.0.0.1',
    port: 5174,
    // Домены продакшена + IP (иначе vite preview отвечает 403)
    allowedHosts: ['proshivka.online', 'www.proshivka.online', 'localhost', '127.0.0.1'],
  },
})
