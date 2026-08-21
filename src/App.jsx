import React, { useState } from 'react';
import CDTSimulator from './components/CDTSimulator';
import DisclaimerModal from './components/DisclaimerModal';
import ThemeToggle from './components/ThemeToggle';
import useTheme from './hooks/useTheme';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [disclaimerAceptado, setDisclaimerAceptado] = useState(false);

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
        </header>

        {/* Main Simulator Component */}
        <main>
          <CDTSimulator />
        </main>

        {/* Footer */}
        <footer className="text-center text-slate-500 dark:text-slate-400 text-sm mt-12 md:mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <p>Valores de referencia para 2026. SMMLV: $1.750.905 COP. Retención en la fuente: 4%. Costos Presuntos UGPP: 27.5%.</p>
          <p className="text-xs">
            Este simulador es una herramienta informativa y no reemplaza la asesoría de un contador o profesional. Valida siempre tu caso particular antes de tomar decisiones.
          </p>
        </footer>

      </div>
    </div>
  );
}

export default App;
