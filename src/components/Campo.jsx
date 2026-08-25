import React from 'react';

/**
 * Envoltorio de campo de formulario (etiqueta + control + ayuda opcional).
 * Compartido entre los paneles de "ajustar supuestos legales" de las
 * distintas pestañas, para no repetir el mismo marcado en cada una.
 */
export default function Campo({ etiqueta, ayuda, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold block">{etiqueta}</label>
      {children}
      {ayuda && <p className="text-xs text-slate-500 dark:text-slate-400">{ayuda}</p>}
    </div>
  );
}
