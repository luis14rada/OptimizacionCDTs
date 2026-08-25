import React, { useState } from 'react';
import { mensualAEA, calcularCostoDeuda } from '../DeudaEngine';
import {
  IBC_VIGENTE,
  FECHA_CORTE_IBC,
  RESOLUCION_IBC,
  MULTIPLICADOR_USURA,
  MULTIPLICADOR_USURA_AGRAVADA,
  TASA_GOTA_A_GOTA_EA,
  FECHA_ESTUDIO_GOTA_A_GOTA,
  FUENTE_GOTA_A_GOTA_URL
} from '../parametrosUsura';
import Campo from './Campo';

const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
const formatPorcentaje = (v) => `${(v * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
const formatFecha = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { dateStyle: 'long' });

// Tailwind necesita ver las clases completas y literales en el código para
// generarlas -- por eso cada clasificación trae su propio juego de clases ya
// armado, en vez de interpolar un "tono" dentro de un template string.
const MENSAJES_CLASIFICACION = {
  legal: {
    titulo: 'Esta tasa está dentro del tope legal',
    icono: '✅',
    contenedor: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    titulo_clase: 'text-green-900 dark:text-green-200',
    texto_clase: 'text-green-800 dark:text-green-300'
  },
  usura: {
    titulo: 'Esto es usura: un delito',
    icono: '⚠️',
    contenedor: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    titulo_clase: 'text-orange-900 dark:text-orange-200',
    texto_clase: 'text-orange-800 dark:text-orange-300'
  },
  usura_agravada: {
    titulo: 'Esto es usura agravada: un delito con pena aumentada',
    icono: '🚨',
    contenedor: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    titulo_clase: 'text-red-900 dark:text-red-200',
    texto_clase: 'text-red-800 dark:text-red-300'
  }
};

export default function CostoRealDeuda() {
  const [monto, setMonto] = useState('');
  const [tasaValor, setTasaValor] = useState('');
  const [tasaEsMensual, setTasaEsMensual] = useState(false);
  const [supuestos, setSupuestos] = useState({
    ibc: IBC_VIGENTE,
    multiplicadorUsura: MULTIPLICADOR_USURA,
    multiplicadorAgravada: MULTIPLICADOR_USURA_AGRAVADA
  });
  const [ajustarAbierto, setAjustarAbierto] = useState(false);

  const cambiarSupuesto = (clave, v) => setSupuestos(prev => ({ ...prev, [clave]: v }));

  const montoNum = parseFloat(monto) || 0;
  const tasaIngresada = (parseFloat(tasaValor) || 0) / 100;
  const tasaEA = tasaEsMensual ? mensualAEA(tasaIngresada) : tasaIngresada;

  const resultado = montoNum > 0 && tasaIngresada > 0
    ? calcularCostoDeuda({ montoDeuda: montoNum, tasaEA, ...supuestos })
    : null;

  const mensaje = resultado ? MENSAJES_CLASIFICACION[resultado.clasificacion] : null;

  return (
    <div className="space-y-8">
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary-900 dark:text-primary-100">El costo real de tu deuda</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            La tasa de usura en Colombia es {formatPorcentaje(supuestos.ibc * supuestos.multiplicadorUsura)} E.A. (corte{' '}
            {formatFecha(FECHA_CORTE_IBC)}) -- cobrar más que eso es delito. Ingresa la tasa que te cobran (mensual o
            anual) para saber si está dentro de la ley.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="monto-deuda" className="text-sm font-semibold">Monto de la deuda (COP)</label>
            <input
              id="monto-deuda"
              type="number"
              min="0"
              step="10000"
              className="glass-input"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="Ej: 5000000"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tasa-deuda" className="text-sm font-semibold">Tasa que te cobran (%)</label>
            <input
              id="tasa-deuda"
              type="number"
              min="0"
              step="0.01"
              className="glass-input"
              value={tasaValor}
              onChange={e => setTasaValor(e.target.value)}
              placeholder="Ej: 20"
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold block">¿Esa tasa es mensual o anual?</span>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="periodo-tasa" checked={!tasaEsMensual} onChange={() => setTasaEsMensual(false)} />
                Efectiva anual
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="periodo-tasa" checked={tasaEsMensual} onChange={() => setTasaEsMensual(true)} />
                Mensual
              </label>
            </div>
          </div>
        </div>
      </section>

      {resultado && mensaje && (
        <section className="glass-card p-6 md:p-8 space-y-4">
          {tasaEsMensual && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {formatPorcentaje(tasaIngresada)} mensual equivale a <strong>{formatPorcentaje(tasaEA)} efectiva anual</strong>.
            </p>
          )}

          <div className={`p-4 border rounded-xl flex gap-3 items-start ${mensaje.contenedor}`}>
            <span className="text-xl" aria-hidden="true">{mensaje.icono}</span>
            <div>
              <p className={`font-semibold text-lg ${mensaje.titulo_clase}`}>{mensaje.titulo}</p>
              <p className={`text-sm mt-1 ${mensaje.texto_clase}`}>
                Te cobran {formatPorcentaje(tasaEA)} E.A. sobre {formatCurrency(montoNum)}. El tope legal es{' '}
                {formatPorcentaje(resultado.tasaUsura)} E.A.
                {resultado.sobrecostoAnual > 0 && (
                  <> Al año, pagas <strong>{formatCurrency(resultado.sobrecostoAnual)}</strong> más de lo que permite la ley.</>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Interés que pagas al año</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(resultado.interesAnualPropio)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Interés al tope legal ({formatPorcentaje(resultado.tasaUsura)})</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(resultado.interesAnualAlTopeLegal)}</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            De referencia: el crédito informal ("gota a gota") le cobra en promedio {formatPorcentaje(TASA_GOTA_A_GOTA_EA)} E.A.
            a los hogares, según ANIF y Colombia Fintech (estudio de {formatFecha(FECHA_ESTUDIO_GOTA_A_GOTA)}).
          </p>

          {resultado.clasificacion !== 'legal' && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cobrar por encima de la tasa de usura es el delito de usura (art. 305 del Código Penal). Esto es información,
              no asesoría legal -- si crees que te están cobrando de forma ilegal, consulta con un abogado o denuncia ante
              la Fiscalía.
            </p>
          )}
        </section>
      )}

      <section className="glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => setAjustarAbierto(a => !a)}
          aria-expanded={ajustarAbierto}
          aria-controls="ajustar-usura"
          className="w-full flex items-center justify-between gap-4 p-5 md:px-8 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div className="min-w-0">
            <h3 className="text-base font-bold text-primary-900 dark:text-primary-100">Supuestos legales usados</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">IBC {formatPorcentaje(supuestos.ibc)} · corte {formatFecha(FECHA_CORTE_IBC)}</p>
          </div>
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400 shrink-0">{ajustarAbierto ? 'Ocultar' : 'Ajustar'}</span>
        </button>

        {ajustarAbierto && (
          <div id="ajustar-usura" className="px-5 md:px-8 pb-6 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              El IBC lo certifica la Superfinanciera <strong>todos los meses</strong> -- si pasó más de un mes desde la
              fecha de corte de arriba, busca el valor vigente y ajústalo acá.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Campo etiqueta="Interés Bancario Corriente (IBC)" ayuda="Como decimal: 0,1977 = 19,77%" htmlFor="ibc-usura">
                <input id="ibc-usura" type="number" step="0.0001" className="glass-input" value={supuestos.ibc}
                  onChange={e => cambiarSupuesto('ibc', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="Multiplicador de usura" ayuda="1,5 = la tasa legal actual" htmlFor="mult-usura">
                <input id="mult-usura" type="number" step="0.1" className="glass-input" value={supuestos.multiplicadorUsura}
                  onChange={e => cambiarSupuesto('multiplicadorUsura', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="Multiplicador de usura agravada" ayuda="3 = la tasa legal actual" htmlFor="mult-agravada">
                <input id="mult-agravada" type="number" step="0.1" className="glass-input" value={supuestos.multiplicadorAgravada}
                  onChange={e => cambiarSupuesto('multiplicadorAgravada', parseFloat(e.target.value) || 0)} />
              </Campo>
            </div>
          </div>
        )}
      </section>

      <section className="glass-card p-6 md:p-8">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Fuente: IBC certificado por {RESOLUCION_IBC}, corte {formatFecha(FECHA_CORTE_IBC)}. Tasa de usura: art. 884 del
          Código de Comercio (1,5x el IBC). Delito de usura: art. 305 del Código Penal. Gota a gota: {' '}
          <a href={FUENTE_GOTA_A_GOTA_URL} target="_blank" rel="noreferrer" className="underline">ANIF y Colombia Fintech</a>,
          estudio de {formatFecha(FECHA_ESTUDIO_GOTA_A_GOTA)}. Esta herramienta informa; no es asesoría legal ni financiera.
        </p>
      </section>
    </div>
  );
}
