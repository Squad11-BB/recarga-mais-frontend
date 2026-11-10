import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png', 'marca/*.png'],
      manifest: {
        name: 'Recarga+',
        short_name: 'Recarga+',
        description: 'Qual carregador deixa o carro pronto mais cedo.',
        lang: 'pt-BR',
        start_url: '/mapa',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#F4F7FA',
        theme_color: '#FCDF30',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Mapa offline parcial: guarda os blocos do mapa já vistos.
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapa-tiles',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
