import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'HaloFormCraft Patient Portal',
        short_name: 'HaloFormCraft',
        description: 'Offline-First Patient Portal',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/submissions'),
            method: 'POST',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'clinical-intake-background-sync',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (in minutes)
                }
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      // Dev proxy: /api/food/ → local food-api running on port 8007 (avoid clash with Halo rbac-service :8001)
      // Run: cd food-api && uvicorn main:app --port 8007
      // (or use port-forward: kubectl port-forward svc/food-api 8007:8000 -n haloform-prod)
      '/api/food': {
        target: 'http://localhost:8007',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/food/, ''),
      },
    },
  },
})

