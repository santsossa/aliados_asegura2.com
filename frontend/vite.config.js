import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      webp: { lossless: false, quality: 90, method: 6 },
      png:  { quality: 90 },
      jpg:  { quality: 85 },
      jpeg: { quality: 85 },
      svg:  { multipass: true },
      includePublic: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
