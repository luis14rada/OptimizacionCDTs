import React, { useEffect, useRef } from 'react';

export default function DisclaimerModal({ onAccept }) {
  const acceptButtonRef = useRef(null);

  useEffect(() => {
    acceptButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      // Evita cerrar el aviso con Escape: debe aceptarse explícitamente.
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      aria-describedby="disclaimer-body"
    >
      <div className="glass-card max-w-lg w-full p-6 md:p-8 space-y-5 bg-white dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">⚖️</span>
          <div>
            <h2 id="disclaimer-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Antes de continuar: aviso legal
            </h2>
          </div>
        </div>

        <div id="disclaimer-body" className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Esta herramienta es un <strong>simulador educativo e informativo</strong>. No constituye
            asesoría contable, tributaria, financiera ni legal, y <strong>no reemplaza a un contador
            público o asesor profesional</strong>.
          </p>
          <p>
            Los cálculos se basan en supuestos generales (SMMLV, tarifas de retención y seguridad
            social vigentes a la fecha) que pueden no aplicar a tu situación particular, cambiar con
            el tiempo, o interpretarse de forma distinta según cada caso concreto.
          </p>
          <p>
            Antes de tomar decisiones de inversión o de cotización a seguridad social, valida
            siempre tu caso específico con un contador o asesor profesional autorizado. El uso de
            esta herramienta es bajo tu propio riesgo y no se asume responsabilidad alguna por
            errores, omisiones, o por decisiones tomadas con base en sus resultados.
          </p>
        </div>

        <button
          ref={acceptButtonRef}
          type="button"
          onClick={onAccept}
          className="btn-primary w-full"
        >
          Entiendo y acepto
        </button>
      </div>
    </div>
  );
}
