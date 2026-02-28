import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // Allows: import SomeComponent from '@/components/SomeComponent'
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
    open: false,
    proxy: {
      // Forward /api/* requests to the FastAPI backend during development.
      // This avoids CORS issues and mirrors the production nginx setup.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
