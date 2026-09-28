import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4173',
    },
  },
  preview: {
    allowedHosts: ['port-0-react-mudmf47i796cc49c.gksl2.cloudtype.app'],
  },
})
