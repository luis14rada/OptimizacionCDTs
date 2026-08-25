import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import CDTSimulator from './components/CDTSimulator';
import CostoCuentaAhorros from './components/CostoCuentaAhorros';
import CadenaRentabilidadReal from './components/CadenaRentabilidadReal';
import DeclararRenta from './components/DeclararRenta';
import CalculadoraGMF from './components/CalculadoraGMF';
import EscaleraCDTsFogafin from './components/EscaleraCDTsFogafin';
import CostoRealDeuda from './components/CostoRealDeuda';
import CuotaManejoCuenta from './components/CuotaManejoCuenta';
import FondoEmergencia from './components/FondoEmergencia';
import DisclaimerModal from './components/DisclaimerModal';
import ThemeToggle from './components/ThemeToggle';
import useTheme from './hooks/useTheme';
import useDocumentMeta from './hooks/useDocumentMeta';
import { RUTAS, rutaDe } from './rutas';

const URL_BASE = 'https://optimizacioncdts.vercel.app';

// El componente de cada pestaña se guarda acá, no en rutas.js: ese archivo
// es puro dato (sin JSX ni imports de React) para que
// scripts/generar-sitemap.js lo pueda leer directo con Node en el build.
const COMPONENTES = {
  cdts: CDTSimulator,
  ahorros: CostoCuentaAhorros,
  'cadena-rentabilidad': CadenaRentabilidadReal,
  'declarar-renta': DeclararRenta,
  gmf: CalculadoraGMF,
  fogafin: EscaleraCDTsFogafin,
  'costo-deuda': CostoRealDeuda,
  'cuota-manejo': CuotaManejoCuenta,
  'fondo-emergencia': FondoEmergencia
};

function JsonLd({ tab }) {
  const datos = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tab.titulo,
    description: tab.metaDescripcion,
    url: `${URL_BASE}${rutaDe(tab)}`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    inLanguage: 'es-CO',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'COP' }
  };

  // eslint-disable-next-line react/no-danger -- JSON serializado, no HTML/JS ejecutable.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }} />;
}

function BarraPestanas({ activoId }) {
  return (
    <nav aria-label="Herramientas" className="inline-flex flex-wrap justify-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60">
      {RUTAS.map(tab => (
        <Link
          key={tab.id}
          to={rutaDe(tab)}
          aria-current={activoId === tab.id ? 'page' : undefined}
          className={activoId === tab.id
            ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow transition-colors'
            : 'px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors'}
        >
          {tab.etiqueta}
        </Link>
      ))}
    </nav>
  );
}

function PestanaPagina({ tab }) {
  useDocumentMeta(tab);
  const Componente = COMPONENTES[tab.id];

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
      <JsonLd tab={tab} />

      {/* Header */}
      <header className="text-center space-y-4">
        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
          Optimizador Financiero
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 tracking-tight">
          {tab.titulo}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
          {tab.descripcion}
        </p>

        <BarraPestanas activoId={tab.id} />
      </header>

      {/* Main: la herramienta de esta ruta */}
      <main>
        <Componente />
      </main>

      {/* Footer */}
      <footer className="text-center text-slate-500 dark:text-slate-400 text-sm mt-12 md:mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {tab.id === 'cdts' && (
          <p>Los valores de referencia (SMMLV, retención, costos presuntos) son configurables en el panel «Parámetros de cálculo».</p>
        )}
        <p className="text-xs">
          Esta herramienta es informativa y no reemplaza la asesoría de un contador o profesional. Valida siempre tu caso particular antes de tomar decisiones.
        </p>
      </footer>
    </div>
  );
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [disclaimerAceptado, setDisclaimerAceptado] = useState(false);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {!disclaimerAceptado && (
        <DisclaimerModal onAccept={() => setDisclaimerAceptado(true)} />
      )}

      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <Routes>
        {RUTAS.map(tab => (
          <Route key={tab.id} path={rutaDe(tab)} element={<PestanaPagina tab={tab} />} />
        ))}
        {/* Cualquier ruta que no exista vuelve al inicio, en vez de un 404 en blanco. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
