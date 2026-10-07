import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/not-todos': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/not_todos': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/hello': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
