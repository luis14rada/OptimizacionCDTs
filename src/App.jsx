import React, { useState } from 'react';
import CDTSimulator from './components/CDTSimulator';
import CostoCuentaAhorros from './components/CostoCuentaAhorros';
import DisclaimerModal from './components/DisclaimerModal';
import ThemeToggle from './components/ThemeToggle';
import useTheme from './hooks/useTheme';

// Primera de varias pestañas planeadas (ver BACKLOG.md): cada una es una
// herramienta aparte dentro de la misma app, no una vista distinta con su
// propio título -- el título general no cambia entre pestañas.
const TABS = [
  { id: 'cdts', etiqueta: 'Optimizador de CDTs' },
  { id: 'ahorros', etiqueta: 'Cuenta de ahorros' }
];

function App() {
  const { theme, toggleTheme } = useTheme();
  const [disclaimerAceptado, setDisclaimerAceptado] = useState(false);
  const [tabActiva, setTabActiva] = useState('cdts');

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {!disclaimerAceptado && (
        <DisclaimerModal onAccept={() => setDisclaimerAceptado(true)} />
      )}

      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">

        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 tracking-tight">
            Optimizador de CDTs
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Calcula la rentabilidad real de tus inversiones en Colombia y descubre el tope máximo para evitar legalmente aportes a seguridad social como rentista de capital.
          </p>

          <div role="tablist" aria-label="Herramientas" className="inline-flex flex-wrap justify-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={tabActiva === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setTabActiva(tab.id)}
                className={tabActiva === tab.id
                  ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow transition-colors'
                  : 'px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors'}
              >
                {tab.etiqueta}
              </button>
            ))}
          </div>
        </header>

        {/* Main: la pestaña activa */}
        <main
          role="tabpanel"
          id={`panel-${tabActiva}`}
          aria-labelledby={`tab-${tabActiva}`}
        >
          {tabActiva === 'cdts' && <CDTSimulator />}
          {tabActiva === 'ahorros' && <CostoCuentaAhorros />}
        </main>

        {/* Footer */}
        <footer className="text-center text-slate-500 dark:text-slate-400 text-sm mt-12 md:mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {tabActiva === 'cdts' && (
            <p>Los valores de referencia (SMMLV, retención, costos presuntos) son configurables en el panel «Parámetros de cálculo».</p>
          )}
          <p className="text-xs">
            Esta herramienta es informativa y no reemplaza la asesoría de un contador o profesional. Valida siempre tu caso particular antes de tomar decisiones.
          </p>
        </footer>

      </div>
    </div>
  );
}

export default App;
