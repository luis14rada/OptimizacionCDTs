import React, { useState } from 'react';
import {
  CONSTANTES_POR_ANIO,
  OPCIONES_RETENCION,
  SITUACIONES_LABORALES,
  parametrosPorDefecto
} from '../parametros';
import Campo from './Campo';

const porcentaje = (v) => `${(v * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
const moneda = (v) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
}).format(v);

const ANIOS_DISPONIBLES = Object.keys(CONSTANTES_POR_ANIO).map(Number).sort((a, b) => b - a);

export default function ParametrosPanel({ parametros, onCambiar, onRestaurar }) {
  const [abierto, setAbierto] = useState(false);

  const constantesAnio = CONSTANTES_POR_ANIO[parametros.anioGravable] || {};
  const situacion = SITUACIONES_LABORALES[parametros.situacionLaboral] || SITUACIONES_LABORALES.rentista;
  const retencionEsEstandar = OPCIONES_RETENCION.some(o => Math.abs(o.valor - parametros.retencion) < 1e-9);

  const cambiar = (campo, valor) => onCambiar({ ...parametros, [campo]: valor });

  const cambiarAnio = (anio) => {
    // Al cambiar de año se recargan las constantes oficiales, pero se conservan
    // las decisiones del usuario que no dependen del año.
    const base = parametrosPorDefecto(anio);
    onCambiar({
      ...base,
      retencion: parametros.retencion,
      situacionLaboral: parametros.situacionLaboral,
      ibcYaCotizado: parametros.ibcYaCotizado
    });
  };

  return (
    <section className="glass-card overflow-hidden print:hidden">
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        aria-controls="panel-parametros"
        className="w-full flex items-center justify-between gap-4 p-5 md:px-8 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-primary-900 dark:text-primary-100">
            Parámetros de cálculo
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {parametros.anioGravable} · Retención {porcentaje(parametros.retencion)} · {situacion.etiqueta}
            {parametros.componenteInflacionarioActivo && ' · Comp. inflacionario activo'}
          </p>
        </div>
        <span className="text-sm font-medium text-primary-600 dark:text-primary-400 shrink-0">
          {abierto ? 'Ocultar' : 'Ajustar'}
        </span>
      </button>

      {abierto && (
        <div id="panel-parametros" className="px-5 md:px-8 pb-6 space-y-6 border-t border-slate-200 dark:border-slate-700 pt-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Campo
              etiqueta="Año gravable"
              htmlFor="param-anio"
              ayuda="Carga el SMMLV y las tarifas oficiales de ese año."
            >
              <select
                id="param-anio"
                className="glass-input"
                value={parametros.anioGravable}
                onChange={e => cambiarAnio(Number(e.target.value))}
              >
                {ANIOS_DISPONIBLES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Campo>

            <Campo
              etiqueta="Retención en la fuente"
              htmlFor="param-retencion"
              ayuda="Si no estás seguro, deja 4%: es la tarifa general."
            >
              <select
                id="param-retencion"
                className="glass-input"
                value={retencionEsEstandar ? String(parametros.retencion) : 'personalizado'}
                onChange={e => {
                  if (e.target.value === 'personalizado') return;
                  cambiar('retencion', Number(e.target.value));
                }}
              >
                {OPCIONES_RETENCION.map(o => (
                  <option key={o.valor} value={String(o.valor)}>{o.etiqueta}</option>
                ))}
                <option value="personalizado">Otro valor…</option>
              </select>
              {!retencionEsEstandar && (
                <input
                  type="number" step="0.1" min="0" max="100"
                  className="glass-input mt-2"
                  aria-label="Retención personalizada en porcentaje"
                  value={(parametros.retencion * 100).toFixed(2)}
                  onChange={e => cambiar('retencion', (parseFloat(e.target.value) || 0) / 100)}
                />
              )}
            </Campo>

            <Campo
              etiqueta="Tu situación laboral"
              htmlFor="param-situacion"
              ayuda={situacion.descripcion}
            >
              <select
                id="param-situacion"
                className="glass-input"
                value={parametros.situacionLaboral}
                onChange={e => cambiar('situacionLaboral', e.target.value)}
              >
                {Object.entries(SITUACIONES_LABORALES).map(([clave, s]) => (
                  <option key={clave} value={clave}>{s.etiqueta}</option>
                ))}
              </select>
            </Campo>

            {situacion.pideIbcPrevio && (
              <Campo
                etiqueta="IBC por el que ya cotizas al mes"
                htmlFor="param-ibc-previo"
                ayuda="Sirve para aplicar el techo de 25 SMMLV sobre tu base total. Déjalo en 0 si no lo sabes."
              >
                <input
                  id="param-ibc-previo"
                  type="number" min="0" step="100000"
                  className="glass-input"
                  value={parametros.ibcYaCotizado || 0}
                  onChange={e => cambiar('ibcYaCotizado', Math.max(0, parseFloat(e.target.value) || 0))}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">{moneda(parametros.ibcYaCotizado || 0)}</p>
              </Campo>
            )}
          </div>

          {/* Componente inflacionario */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-primary-600"
                checked={parametros.componenteInflacionarioActivo}
                onChange={e => cambiar('componenteInflacionarioActivo', e.target.checked)}
              />
              <span>
                <span className="text-sm font-semibold block">Aplicar componente inflacionario</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Parte del rendimiento es ingreso no constitutivo de renta. Al activarlo, la retención se calcula solo sobre la porción gravada.
                </span>
              </span>
            </label>

            {parametros.componenteInflacionarioActivo && (
              <div className="pl-7 space-y-1.5">
                <label htmlFor="param-comp-inf" className="text-sm font-semibold block">
                  Porcentaje no gravado
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    id="param-comp-inf"
                    type="number" step="0.01" min="0" max="100"
                    className="glass-input"
                    value={(parametros.componenteInflacionario * 100).toFixed(2)}
                    onChange={e => cambiar('componenteInflacionario', Math.min(1, Math.max(0, (parseFloat(e.target.value) || 0) / 100)))}
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              </div>
            )}

            {constantesAnio.notaComponente && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-7">
                {constantesAnio.notaComponente}
              </p>
            )}
          </div>

          {/* Avanzado */}
          <details className="rounded-xl border border-slate-200 dark:border-slate-700">
            <summary className="cursor-pointer p-4 text-sm font-semibold">
              Valores avanzados
            </summary>
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Campo etiqueta="SMMLV" htmlFor="param-smmlv" ayuda={moneda(parametros.smmlv)}>
                <input id="param-smmlv" type="number" min="0" step="1000" className="glass-input"
                  value={parametros.smmlv}
                  onChange={e => cambiar('smmlv', Math.max(0, parseFloat(e.target.value) || 0))} />
              </Campo>

              <Campo etiqueta="Costos presuntos UGPP (%)" htmlFor="param-costos"
                ayuda="Porcentaje que se descuenta del ingreso antes de calcular el IBC.">
                <input id="param-costos" type="number" step="0.1" min="0" max="100" className="glass-input"
                  value={(parametros.costosPresuntos * 100).toFixed(2)}
                  onChange={e => cambiar('costosPresuntos', Math.min(1, Math.max(0, (parseFloat(e.target.value) || 0) / 100)))} />
              </Campo>

              <Campo etiqueta="Tarifa de salud (%)" htmlFor="param-salud">
                <input id="param-salud" type="number" step="0.1" min="0" max="100" className="glass-input"
                  value={(parametros.tarifaSalud * 100).toFixed(2)}
                  onChange={e => cambiar('tarifaSalud', Math.max(0, (parseFloat(e.target.value) || 0) / 100))} />
              </Campo>

              <Campo etiqueta="Tarifa de pensión (%)" htmlFor="param-pension">
                <input id="param-pension" type="number" step="0.1" min="0" max="100" className="glass-input"
                  value={(parametros.tarifaPension * 100).toFixed(2)}
                  onChange={e => cambiar('tarifaPension', Math.max(0, (parseFloat(e.target.value) || 0) / 100))} />
              </Campo>

              <Campo etiqueta="Tope del IBC (en SMMLV)" htmlFor="param-tope"
                ayuda={`Actualmente ${moneda(parametros.smmlv * parametros.topeIbcSmmlv)}`}>
                <input id="param-tope" type="number" min="1" step="1" className="glass-input"
                  value={parametros.topeIbcSmmlv}
                  onChange={e => cambiar('topeIbcSmmlv', Math.max(1, parseInt(e.target.value, 10) || 1))} />
              </Campo>
            </div>
          </details>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              Estos valores son supuestos, no una verdad legal. Los aportes a seguridad social tienen matices
              según cada caso — valida el tuyo con un contador antes de tomar decisiones.
            </p>
            <button type="button" onClick={onRestaurar} className="btn-secondary whitespace-nowrap shrink-0">
              Restaurar valores por defecto
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
