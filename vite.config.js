import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

function parseCookie(header = '') {
  return header.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=')
    if (!k) return acc
    acc[k] = decodeURIComponent(v.join('=') || '')
    return acc
  }, {})
}

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Grape',
        short_name: 'Grape',
        description: 'Secure chat',
        theme_color: '#030712',
        background_color: '#030712',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        // target: 'http://localhost:8081',
        target: 'http://5.129.194.222:8081',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://5.129.194.222:8081',
        // target: 'ws://localhost:8081',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq, req) => {
            const cookies = parseCookie(req.headers.cookie || '')
            const token = cookies['auth_token']
            if (token) {
              proxyReq.setHeader('Authorization', token)
            }
          })
        },
      },
    },
  },
})
