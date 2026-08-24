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
    css: false,
    coverage: {
      provider: 'v8',
      all: true, // cuenta también los archivos sin ninguna prueba, como 0%
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/test/**',
        'src/main.jsx', // bootstrap puro: createRoot().render(), sin lógica que probar
        'src/vacio.js'  // stub vacío a propósito, para sacar html2canvas/dompurify del bundle
      ],
      // El reporter "text" (la tabla en consola) tiene un bug conocido en esta
      // versión de Vitest: omite algunos archivos de la tabla aunque sí tengan
      // pruebas y sí se midan. El HTML sí los muestra todos — es la fuente
      // confiable para el detalle por archivo (abrir coverage/index.html).
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        // Medido el 24 de agosto de 2026: 83.26% / 70.18% / 75.2% / 84.51%.
        // Unos puntos por debajo como margen ante fluctuaciones menores, sin
        // dejar de detectar una regresión real (p. ej. un archivo grande
        // nuevo sin ninguna prueba).
        statements: 80,
        branches: 65,
        functions: 70,
        lines: 80
      }
    }
  }
})
