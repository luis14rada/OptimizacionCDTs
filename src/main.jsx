import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Tipografía Inter servida desde el propio dominio: el CSS ya la declaraba
// pero nunca se cargaba, así que el diseño caía a la fuente del sistema.
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
