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
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://5.129.194.22:8081',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://5.129.194.22:8081',
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
