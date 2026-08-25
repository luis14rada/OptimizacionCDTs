import React, { useState } from 'react';
import { calcularComparacion } from '../AhorrosEngine';
import {
  TASAS_AHORRO,
  FECHA_CORTE_TASAS,
  FUENTE_TASAS,
  FUENTE_TASAS_URL,
  INFLACION_ANUAL_REFERENCIA,
  FECHA_CORTE_INFLACION
} from '../tasasAhorro';

const OTRA_ENTIDAD = 'otra';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatPorcentaje = (v) => `${(v * 100).toFixed(2).replace(/\.?0+$/, '')}%`;

// v * 100 puede arrastrar imprecisión de punto flotante (0.0007 * 100 =
// 0.06999999999999999). Redondeado a 2 decimales antes de mostrarlo en un
// input, para que el campo no muestre ese arrastre.
const tasaEAaPorcentaje = (tasaEA) => String(Math.round(tasaEA * 100 * 100) / 100);

const formatFecha = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { dateStyle: 'long' });

// La de tasa más alta de la tabla, para preseleccionarla como "comparar contra".
// No se la nombra "la mejor" en ningún texto -- ver BACKLOG.md.
const entidadTasaMasAlta = TASAS_AHORRO.reduce((max, t) => (t.tasaEA > max.tasaEA ? t : max), TASAS_AHORRO[0]);
const entidadTasaMasBaja = TASAS_AHORRO.reduce((min, t) => (t.tasaEA < min.tasaEA ? t : min), TASAS_AHORRO[0]);

export default function CostoCuentaAhorros() {
  const [saldo, setSaldo] = useState('');
  const [entidadActual, setEntidadActual] = useState(entidadTasaMasBaja.entidad);
  const [tasaActualPct, setTasaActualPct] = useState(tasaEAaPorcentaje(entidadTasaMasBaja.tasaEA));
  const [entidadAlternativa, setEntidadAlternativa] = useState(entidadTasaMasAlta.entidad);
  const [tasaAlternativaPct, setTasaAlternativaPct] = useState(tasaEAaPorcentaje(entidadTasaMasAlta.tasaEA));

  const cambiarEntidad = (valor, setEntidad, setTasaPct) => {
    setEntidad(valor);
    if (valor !== OTRA_ENTIDAD) {
      const encontrada = TASAS_AHORRO.find(t => t.entidad === valor);
      if (encontrada) setTasaPct(tasaEAaPorcentaje(encontrada.tasaEA));
    }
  };

  const saldoNum = parseFloat(saldo) || 0;
  const tasaActual = (parseFloat(tasaActualPct) || 0) / 100;
  const tasaAlternativa = (parseFloat(tasaAlternativaPct) || 0) / 100;

  const resultado = saldoNum > 0
    ? calcularComparacion({ saldo: saldoNum, tasaActual, tasaAlternativa, inflacionAnual: INFLACION_ANUAL_REFERENCIA })
    : null;

  const pierdePoderAdquisitivo = resultado && resultado.variacionPoderAdquisitivoActual < 0;
  const hayDiferenciaPositiva = resultado && resultado.diferenciaAnualNominal > 0;

  return (
    <div className="space-y-8">
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary-900 dark:text-primary-100">Comparador de cuentas de ahorro</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            En el mismo mes, las cuentas de ahorro en Colombia pagan tasas muy distintas por el mismo riesgo y la misma
            liquidez. Elegí tu entidad y otra para comparar, y mirá qué tan lejos queda cada una de la inflación.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tu cuenta actual</h3>
            <div className="space-y-2">
              <label htmlFor="entidadActual" className="text-sm font-semibold">Entidad</label>
              <select
                id="entidadActual"
                className="glass-input"
                value={entidadActual}
                onChange={e => cambiarEntidad(e.target.value, setEntidadActual, setTasaActualPct)}
              >
                {TASAS_AHORRO.map(t => (
                  <option key={t.entidad} value={t.entidad}>{t.entidad}</option>
                ))}
                <option value={OTRA_ENTIDAD}>Otra entidad</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="tasaActual" className="text-sm font-semibold">Tasa E.A. (%)</label>
              <input
                id="tasaActual"
                type="number"
                min="0"
                step="0.01"
                className="glass-input"
                value={tasaActualPct}
                onChange={e => setTasaActualPct(e.target.value)}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Se autocompleta al elegir la entidad; corregila si conocés la tasa real de tu producto.</p>
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Comparar contra</h3>
            <div className="space-y-2">
              <label htmlFor="entidadAlternativa" className="text-sm font-semibold">Entidad</label>
              <select
                id="entidadAlternativa"
                className="glass-input"
                value={entidadAlternativa}
                onChange={e => cambiarEntidad(e.target.value, setEntidadAlternativa, setTasaAlternativaPct)}
              >
                {TASAS_AHORRO.map(t => (
                  <option key={t.entidad} value={t.entidad}>{t.entidad}</option>
                ))}
                <option value={OTRA_ENTIDAD}>Otra entidad</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="tasaAlternativa" className="text-sm font-semibold">Tasa E.A. (%)</label>
              <input
                id="tasaAlternativa"
                type="number"
                min="0"
                step="0.01"
                className="glass-input"
                value={tasaAlternativaPct}
                onChange={e => setTasaAlternativaPct(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <label htmlFor="saldo" className="text-sm font-semibold">Saldo promedio en tu cuenta (COP)</label>
          <input
            id="saldo"
            type="number"
            min="0"
            step="1000"
            className="glass-input"
            value={saldo}
            onChange={e => setSaldo(e.target.value)}
            placeholder="Ej: 10000000"
          />
          {saldo && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(saldoNum)}</p>
          )}
        </div>
      </section>

      {resultado && (
        <section className="glass-card p-6 md:p-8 space-y-4">
          <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100">Con {formatCurrency(saldoNum)} en {entidadActual === OTRA_ENTIDAD ? 'tu entidad' : entidadActual}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Rendimiento nominal al año</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(resultado.rendimientoNominalActual)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatPorcentaje(tasaActual)} E.A., antes de inflación</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Con {entidadAlternativa === OTRA_ENTIDAD ? 'la alternativa' : entidadAlternativa}, rendiría</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(resultado.rendimientoNominalAlternativa)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatPorcentaje(tasaAlternativa)} E.A.</p>
            </div>
          </div>

          {hayDiferenciaPositiva && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Diferencia: <span className="font-bold">{formatCurrency(resultado.diferenciaAnualNominal)}</span> al año entre las dos, con el mismo saldo.
            </p>
          )}

          {pierdePoderAdquisitivo ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">⚠️</span>
              <div>
                <p className="text-orange-900 dark:text-orange-200 font-semibold text-lg">Estás perdiendo poder adquisitivo</p>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                  Con la inflación en {formatPorcentaje(INFLACION_ANUAL_REFERENCIA)} (IPC de julio de 2026, DANE), tu retorno real es {formatPorcentaje(resultado.retornoRealActual)}.
                  Aunque el saldo nominal crece, perdés <span className="font-bold">{formatCurrency(Math.abs(resultado.variacionPoderAdquisitivoActual))}</span> de poder adquisitivo al año.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">✅</span>
              <div>
                <p className="text-green-900 dark:text-green-200 font-semibold text-lg">Tu plata gana poder adquisitivo</p>
                <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                  Con la inflación en {formatPorcentaje(INFLACION_ANUAL_REFERENCIA)} (IPC de julio de 2026, DANE), tu retorno real es {formatPorcentaje(resultado.retornoRealActual)}:
                  ganás <span className="font-bold">{formatCurrency(resultado.variacionPoderAdquisitivoActual)}</span> al año en términos reales.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="glass-card p-6 md:p-8 overflow-x-auto space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-1 text-primary-900 dark:text-primary-100">Tasas de referencia</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tasa de captación E.A. real por entidad, no la tasa promocional que anuncia cada banco para un producto puntual.</p>
        </div>

        <table className="w-full text-left text-sm">
          <caption className="sr-only">Tasas efectivas anuales de cuentas de ahorro por entidad</caption>
          <thead className="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" className="py-2 pr-4">Entidad</th>
              <th scope="col" className="py-2 pl-4">Tasa E.A.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {TASAS_AHORRO.map(t => (
              <tr key={t.entidad}>
                <td className="py-2 pr-4">{t.entidad}</td>
                <td className="py-2 pl-4 tabular-nums">{formatPorcentaje(t.tasaEA)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Fuente: <a href={FUENTE_TASAS_URL} target="_blank" rel="noreferrer" className="underline">{FUENTE_TASAS}</a>, corte {formatFecha(FECHA_CORTE_TASAS)}.
          Inflación de referencia: {formatPorcentaje(INFLACION_ANUAL_REFERENCIA)} (IPC, DANE), corte {formatFecha(FECHA_CORTE_INFLACION)}.
          Esta tabla informa y compara tasas públicas; no es una recomendación de dónde poner tu plata — validá siempre la tasa vigente directamente con la entidad.
        </p>
      </section>
    </div>
  );
}
