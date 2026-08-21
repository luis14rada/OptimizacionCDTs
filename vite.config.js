import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      // jsPDF solo las usa en su método .html(), que este proyecto no llama.
      html2canvas: fileURLToPath(new URL('./src/vacio.js', import.meta.url)),
      dompurify: fileURLToPath(new URL('./src/vacio.js', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false
  }
})
