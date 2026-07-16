import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: {
      '@enterprise/vue-iframe-wrapper': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
})
