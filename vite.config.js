import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['port-0-react-mudmf47i796cc49c.gksl2.cloudtype.app'],
  },
})
