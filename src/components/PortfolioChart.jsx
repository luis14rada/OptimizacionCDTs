import React from 'react';
import { SMMLV_2026 } from '../OptimizationEngine';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatMes = (mesKey) => {
  const [anio, mes] = mesKey.split('-');
  const nombreMes = MESES_CORTOS[Number(mes) - 1];
  return `${nombreMes} ${anio.slice(2)}`;
};

export default function PortfolioChart({ flujoMensual }) {
  if (!flujoMensual || flujoMensual.length === 0) return null;

  const maxValor = Math.max(SMMLV_2026, ...flujoMensual.map(f => f.ingresoBrutoMes)) * 1.08;
  const topePorcentaje = (SMMLV_2026 / maxValor) * 100;

  return (
    <section className="glass-card p-6 md:p-8 space-y-5" aria-labelledby="chart-title">
      <div>
        <h3 id="chart-title" className="text-xl font-bold text-primary-900 dark:text-primary-100">
          Flujo de intereses brutos por mes
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Suma de intereses de todos tus CDTs en cada mes, comparada contra el tope de 1 SMMLV que activa seguridad social.
        </p>
      </div>

      {/* Leyenda: el color nunca es la única señal, siempre va acompañado de texto */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-400" aria-hidden="true"></span>
          Bajo el tope (sin seguridad social)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-orange-500 dark:bg-orange-400" aria-hidden="true"></span>
          Supera el tope (activa seguridad social)
        </span>
      </div>

      <div className="relative pl-2 pr-1">
        {/* Línea de referencia del tope de 1 SMMLV */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-400 dark:border-slate-500 z-10"
          style={{ left: `calc(${Math.min(topePorcentaje, 100)}% + 0.5rem)` }}
          aria-hidden="true"
        >
          <span className="absolute -top-1 left-1 text-[10px] whitespace-nowrap text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 px-1 rounded">
            Tope 1 SMMLV ({formatCurrency(SMMLV_2026)})
          </span>
        </div>

        <ul className="space-y-3 pt-6">
          {flujoMensual.map((mes) => {
            const anchoPorcentaje = Math.max((mes.ingresoBrutoMes / maxValor) * 100, 1.5);
            const color = mes.excedeTope
              ? 'bg-orange-500 dark:bg-orange-400'
              : 'bg-green-500 dark:bg-green-400';

            return (
              <li key={mes.mesKey} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs text-slate-500 dark:text-slate-400 text-right capitalize">
                  {formatMes(mes.mesKey)}
                </span>
                <div className="relative flex-1 h-6 rounded bg-slate-100 dark:bg-slate-800/60">
                  <div
                    className={`h-full rounded-r-md ${color}`}
                    style={{ width: `${Math.min(anchoPorcentaje, 100)}%` }}
                    title={`${formatMes(mes.mesKey)}: intereses brutos ${formatCurrency(mes.ingresoBrutoMes)}${mes.excedeTope ? ` · Seg. social ${formatCurrency(mes.segSocialMes)}` : ' · sin seguridad social'}`}
                  ></div>
                </div>
                <span className="w-28 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                  {formatCurrency(mes.ingresoBrutoMes)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
