import React, { useState } from 'react';
import {
  CONSTANTES_POR_ANIO,
  OPCIONES_RETENCION,
  OPCIONES_BASE_UMBRAL,
  FUENTE_UMBRAL,
  FUENTE_IBC,
  OPCIONES_UMBRAL_SALARIO,
  FUENTE_UMBRAL_SALARIO,
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
      ibcYaCotizado: parametros.ibcYaCotizado,
      // Es una interpretación de norma elegida por la persona, no una
      // constante del año: no se pisa al cambiar de año gravable.
      umbralSobreIngresoNeto: parametros.umbralSobreIngresoNeto,
      umbralAplicaConSalario: parametros.umbralAplicaConSalario
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
            {parametros.umbralSobreIngresoNeto === false && ' · Umbral sobre bruto'}
            {parametros.umbralAplicaConSalario === false && ' · Sin umbral por tener salario'}
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

            <Campo
              etiqueta="El umbral de 1 SMMLV se mide sobre"
              htmlFor="param-base-umbral"
              ayuda={OPCIONES_BASE_UMBRAL.find(o => o.valor === (parametros.umbralSobreIngresoNeto !== false))?.descripcion}
            >
              <select
                id="param-base-umbral"
                className="glass-input"
                value={parametros.umbralSobreIngresoNeto !== false ? 'neto' : 'bruto'}
                onChange={e => cambiar('umbralSobreIngresoNeto', e.target.value === 'neto')}
              >
                {OPCIONES_BASE_UMBRAL.map(o => (
                  <option key={String(o.valor)} value={o.valor ? 'neto' : 'bruto'}>{o.etiqueta}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Por defecto se usa el <strong>neto</strong>, siguiendo el{' '}
                <a href={FUENTE_UMBRAL.urlLey} target="_blank" rel="noreferrer" className="underline">
                  {FUENTE_UMBRAL.norma}
                </a>, que obliga a cotizar a quien tenga «{FUENTE_UMBRAL.cita}». Lo confirma el{' '}
                <a href={FUENTE_UMBRAL.urlUgpp} target="_blank" rel="noreferrer" className="underline">
                  ABC de rentistas de capital de la UGPP
                </a>. Si tu contador lo interpreta distinto, puedes cambiarlo a bruto aquí.
              </p>
            </Campo>

            {!SITUACIONES_LABORALES[parametros.situacionLaboral]?.aplicaPisoIbc && (
              <Campo
                etiqueta="¿Ese umbral te aplica aunque ya tengas salario?"
                htmlFor="param-umbral-salario"
                ayuda={OPCIONES_UMBRAL_SALARIO.find(o => o.valor === (parametros.umbralAplicaConSalario !== false))?.descripcion}
              >
                <select
                  id="param-umbral-salario"
                  className="glass-input"
                  value={parametros.umbralAplicaConSalario !== false ? 'si' : 'no'}
                  onChange={e => cambiar('umbralAplicaConSalario', e.target.value === 'si')}
                >
                  {OPCIONES_UMBRAL_SALARIO.map(o => (
                    <option key={String(o.valor)} value={o.valor ? 'si' : 'no'}>{o.etiqueta}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  El{' '}
                  <a href={FUENTE_UMBRAL_SALARIO.urlLey} target="_blank" rel="noreferrer" className="underline">
                    {FUENTE_UMBRAL_SALARIO.norma}
                  </a>{' '}
                  hace nacer la obligación cuando se perciben ingresos netos de 1 SMMLV al mes, sin condicionarla a
                  tener o no vínculo laboral, y el{' '}
                  <a href={FUENTE_UMBRAL_SALARIO.urlUgpp} target="_blank" rel="noreferrer" className="underline">
                    ABC de rentistas de capital de la UGPP
                  </a>{' '}
                  trata como independiente a quien, teniendo salario, percibe además otros ingresos. No hay concepto
                  oficial que resuelva expresamente el caso mixto, así que puedes cambiarlo al criterio conservador.
                </p>
              </Campo>
            )}

            {situacion.pideIbcPrevio && (
              <Campo
                etiqueta="Salario mensual sobre el que ya cotizas (IBC)"
                htmlFor="param-ibc-previo"
              >
                <input
                  id="param-ibc-previo"
                  type="number" min="0" step="100000"
                  className="glass-input"
                  value={parametros.ibcYaCotizado || 0}
                  onChange={e => cambiar('ibcYaCotizado', Math.max(0, parseFloat(e.target.value) || 0))}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">{moneda(parametros.ibcYaCotizado || 0)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <strong>Qué poner:</strong> el valor que aparece como base de salud y pensión en tu desprendible de
                  nómina — no tu salario total ni lo que te consignan. Es tu salario mensual más lo que sea
                  contraprestación directa del servicio (comisiones,
                  horas extras, bonificaciones salariales). <strong>No</strong> entran el auxilio de transporte ni
                  las prestaciones sociales. Si tienes salario integral, es el <strong>70%</strong> de lo pactado.
                  La base tiene piso de 1 SMMLV ({moneda(parametros.smmlv)}) y techo de {FUENTE_IBC.topeSmmlv} SMMLV
                  ({moneda(parametros.smmlv * FUENTE_IBC.topeSmmlv)}). Base normativa: {FUENTE_IBC.norma}.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Si no lo sabes, déjalo en 0: solo se usa para aplicar el techo de {FUENTE_IBC.topeSmmlv} SMMLV sobre
                  tu base combinada, así que dejarlo en 0 nunca subestima tus aportes.
                </p>
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
