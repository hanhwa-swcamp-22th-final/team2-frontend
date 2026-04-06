import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Auth Service (8011)
      '/api/auth': { target: 'http://localhost:8011', changeOrigin: true },
      '/api/users': { target: 'http://localhost:8011', changeOrigin: true },
      '/api/positions': { target: 'http://localhost:8011', changeOrigin: true },
      '/api/departments': { target: 'http://localhost:8011', changeOrigin: true },
      '/api/company': { target: 'http://localhost:8011', changeOrigin: true },

      // Master Service (8012)
      '/api/clients': { target: 'http://localhost:8012', changeOrigin: true },
      '/api/items': { target: 'http://localhost:8012', changeOrigin: true },
      '/api/buyers': { target: 'http://localhost:8012', changeOrigin: true },
      '/api/countries': { target: 'http://localhost:8012', changeOrigin: true },
      '/api/ports': { target: 'http://localhost:8012', changeOrigin: true },
      '/api/currencies': { target: 'http://localhost:8012', changeOrigin: true },
      '/api/incoterms': { target: 'http://localhost:8012', changeOrigin: true },
      '/api/payment-terms': { target: 'http://localhost:8012', changeOrigin: true },

      // Activity Service (8083)
      '/api/activities': { target: 'http://localhost:8083', changeOrigin: true },
      '/api/activity-packages': { target: 'http://localhost:8083', changeOrigin: true },
      '/api/email-logs': { target: 'http://localhost:8083', changeOrigin: true },
      '/api/contacts': { target: 'http://localhost:8083', changeOrigin: true },

      // Documents Service (8084)
      '/api/purchase-orders': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/proforma-invoices': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/commercial-invoices': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/packing-lists': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/production-orders': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/shipment-orders': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/shipments': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/collections': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/approval-requests': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/emails': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/docs-revisions': { target: 'http://localhost:8084', changeOrigin: true },
    },
  },
})
