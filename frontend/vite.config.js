import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Forward all backend routes to FastAPI.
      // Use 127.0.0.1 explicitly — "localhost" resolves to IPv6 (::1) on
      // Node 18+ which causes ECONNREFUSED when FastAPI listens on IPv4 only.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/upload-resume': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/students': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/profile': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/profiles': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
