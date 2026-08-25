import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Tipografía Inter servida desde el propio dominio: el CSS ya la declaraba
// pero nunca se cargaba, así que el diseño caía a la fuente del sistema.
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { Analytics } from '@vercel/analytics/react'

// El router vive acá, no dentro de App.jsx, para que las pruebas puedan
// envolver <App /> con <MemoryRouter> en vez del BrowserRouter real.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
    {/* Fuera del ErrorBoundary a propósito: sigue funcionando aunque App falle. */}
    <Analytics />
  </StrictMode>,
)
