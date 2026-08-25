import React, { useState } from 'react';
import CDTSimulator from './components/CDTSimulator';
import CostoCuentaAhorros from './components/CostoCuentaAhorros';
import CadenaRentabilidadReal from './components/CadenaRentabilidadReal';
import DeclararRenta from './components/DeclararRenta';
import CalculadoraGMF from './components/CalculadoraGMF';
import EscaleraCDTsFogafin from './components/EscaleraCDTsFogafin';
import DisclaimerModal from './components/DisclaimerModal';
import ThemeToggle from './components/ThemeToggle';
import useTheme from './hooks/useTheme';

// Primera de varias pestañas planeadas (ver BACKLOG.md): cada una es una
// herramienta aparte dentro de la misma app. El título y la bajada del
// encabezado cambian según la pestaña activa -- "etiqueta" es el texto corto
// del botón de la pestaña; "titulo"/"descripcion" son el encabezado completo
// que se muestra arriba cuando esa pestaña está activa.
const TABS = [
  {
    id: 'cdts',
    etiqueta: 'Optimizador de CDTs',
    titulo: 'Optimizador de CDTs',
    descripcion: 'Calcula la rentabilidad real de tus inversiones en Colombia y descubre el tope máximo para evitar legalmente aportes a seguridad social como rentista de capital.'
  },
  {
    id: 'ahorros',
    etiqueta: 'Cuenta de ahorros',
    titulo: '¿Cuánto te cuesta tu cuenta de ahorros?',
    descripcion: 'Compará la tasa de tu cuenta contra otras del mercado colombiano y contra la inflación, para saber si tu plata gana o pierde poder adquisitivo real.'
  },
  {
    id: 'cadena-rentabilidad',
    etiqueta: 'Rentabilidad real',
    titulo: 'Rentabilidad real: la cadena completa',
    descripcion: 'De la tasa nominal que anuncia cualquier producto hasta lo que realmente queda después de la retención en la fuente y la inflación.'
  },
  {
    id: 'declarar-renta',
    etiqueta: '¿Declaro renta?',
    titulo: '¿Me toca declarar renta?',
    descripcion: 'Revisá los cinco topes del Estatuto Tributario para saber si quedás obligado a declarar renta este año.'
  },
  {
    id: 'gmf',
    etiqueta: '4×1000',
    titulo: '4×1000: cuánto pagás y cómo dejar de pagarlo',
    descripcion: 'Calculá cuánto te cobra el Gravamen a los Movimientos Financieros y cuánto ahorrarías marcando una cuenta como exenta.'
  },
  {
    id: 'fogafin',
    etiqueta: 'Escalera Fogafín',
    titulo: 'Escalera de CDTs y cobertura Fogafín',
    descripcion: 'Repartí tu plata entre entidades para que el seguro de depósitos cubra todo lo que tenés invertido.'
  }
];

function App() {
  const { theme, toggleTheme } = useTheme();
  const [disclaimerAceptado, setDisclaimerAceptado] = useState(false);
  const [tabActiva, setTabActiva] = useState('cdts');
  const tabInfo = TABS.find(tab => tab.id === tabActiva) || TABS[0];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {!disclaimerAceptado && (
        <DisclaimerModal onAccept={() => setDisclaimerAceptado(true)} />
      )}

      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">

        {/* Header */}
        <header className="text-center space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
            Optimizador Financiero
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 tracking-tight">
            {tabInfo.titulo}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            {tabInfo.descripcion}
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
          {tabActiva === 'cadena-rentabilidad' && <CadenaRentabilidadReal />}
          {tabActiva === 'declarar-renta' && <DeclararRenta />}
          {tabActiva === 'gmf' && <CalculadoraGMF />}
          {tabActiva === 'fogafin' && <EscaleraCDTsFogafin />}
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
