import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '', // Changed from '/Brainly-Ban-Checker/' to '' so it works on any hosting platform without needing to adjust the base path
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})