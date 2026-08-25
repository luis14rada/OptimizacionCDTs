import React, { useState } from 'react';
import { calcularCadenaRentabilidad } from '../RentabilidadRealEngine';
import { OPCIONES_RETENCION } from '../parametros';
import { INFLACION_ANUAL_REFERENCIA, FECHA_CORTE_INFLACION } from '../tasasAhorro';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatPorcentaje = (v) => `${(v * 100).toFixed(2).replace(/\.?0+$/, '')}%`;

const formatFecha = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { dateStyle: 'long' });

export default function CadenaRentabilidadReal() {
  const [saldo, setSaldo] = useState('');
  const [tasaNominalPct, setTasaNominalPct] = useState('10');
  const [retencion, setRetencion] = useState(OPCIONES_RETENCION[0].valor);

  const saldoNum = parseFloat(saldo) || 0;
  const tasaNominalEA = (parseFloat(tasaNominalPct) || 0) / 100;

  const resultado = saldoNum > 0 && tasaNominalEA > 0
    ? calcularCadenaRentabilidad({ saldo: saldoNum, tasaNominalEA, retencion, inflacionAnual: INFLACION_ANUAL_REFERENCIA })
    : null;

  const pierdePoderAdquisitivo = resultado && resultado.retornoRealNeto < 0;
  const menosDeLaMitad = resultado && resultado.porcentajeDeLoNominal < 0.5;

  return (
    <div className="space-y-8">
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary-900 dark:text-primary-100">Rentabilidad real: la cadena completa</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            La tasa que anuncia cualquier producto (CDT, fondo, cuenta) no es lo que realmente te queda. Primero se
            descuenta la retención en la fuente, y lo que sobra se lo come la inflación. Ingresá la tasa nominal de
            cualquier producto y mirá cada eslabón de la cadena.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="montoInvertir" className="text-sm font-semibold">Monto a invertir (COP)</label>
            <input
              id="montoInvertir"
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

          <div className="space-y-2">
            <label htmlFor="tasaNominal" className="text-sm font-semibold">Tasa nominal E.A. (%)</label>
            <input
              id="tasaNominal"
              type="number"
              min="0"
              step="0.01"
              className="glass-input"
              value={tasaNominalPct}
              onChange={e => setTasaNominalPct(e.target.value)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">La que anuncia el producto: CDT, fondo, cuenta de ahorros, etc.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="retencion" className="text-sm font-semibold">Retención en la fuente</label>
            <select
              id="retencion"
              className="glass-input"
              value={retencion}
              onChange={e => setRetencion(parseFloat(e.target.value))}
            >
              {OPCIONES_RETENCION.map(o => (
                <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {OPCIONES_RETENCION.find(o => o.valor === retencion)?.descripcion}
            </p>
          </div>
        </div>
      </section>

      {resultado && (
        <section className="glass-card p-6 md:p-8 space-y-6">
          <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100">La cadena completa, con {formatCurrency(saldoNum)}</h3>

          <ol className="space-y-3">
            <li className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Tasa nominal E.A.</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Lo que anuncia el producto</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatPorcentaje(tasaNominalEA)}</p>
                <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatCurrency(resultado.rendimientoNominal)}</p>
              </div>
            </li>

            <li className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">– Retención en la fuente ({formatPorcentaje(retencion)})</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Queda la tasa neta de retención</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatPorcentaje(resultado.tasaNetaRetencion)}</p>
                <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatCurrency(resultado.rendimientoNetoRetencion)}</p>
              </div>
            </li>

            <li className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${pierdePoderAdquisitivo ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'}`}>
              <div>
                <p className={`font-semibold ${pierdePoderAdquisitivo ? 'text-orange-900 dark:text-orange-200' : 'text-green-900 dark:text-green-200'}`}>
                  – Inflación ({formatPorcentaje(INFLACION_ANUAL_REFERENCIA)}) = Retorno real
                </p>
                <p className={`text-xs ${pierdePoderAdquisitivo ? 'text-orange-800 dark:text-orange-300' : 'text-green-800 dark:text-green-300'}`}>
                  Lo que de verdad ganás en poder adquisitivo
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold tabular-nums ${pierdePoderAdquisitivo ? 'text-orange-900 dark:text-orange-200' : 'text-green-900 dark:text-green-200'}`}>
                  {formatPorcentaje(resultado.retornoRealNeto)}
                </p>
                <p className={`text-xs tabular-nums ${pierdePoderAdquisitivo ? 'text-orange-800 dark:text-orange-300' : 'text-green-800 dark:text-green-300'}`}>
                  {formatCurrency(resultado.gananciaRealPesos)}
                </p>
              </div>
            </li>
          </ol>

          {pierdePoderAdquisitivo ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">⚠️</span>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Con {formatPorcentaje(tasaNominalEA)} nominal, después de retención e inflación estás{' '}
                <span className="font-bold">perdiendo poder adquisitivo</span>: tu retorno real es {formatPorcentaje(resultado.retornoRealNeto)}.
              </p>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border flex gap-3 items-start ${menosDeLaMitad ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'}`}>
              <span className="text-xl" aria-hidden="true">{menosDeLaMitad ? 'ℹ️' : '✅'}</span>
              <p className={`text-sm ${menosDeLaMitad ? 'text-amber-800 dark:text-amber-300' : 'text-green-800 dark:text-green-300'}`}>
                De tu ganancia nominal del {formatPorcentaje(tasaNominalEA)}, después de retención e inflación te queda{' '}
                <span className="font-bold">el {formatPorcentaje(resultado.porcentajeDeLoNominal)} en términos reales</span>
                {menosDeLaMitad ? ': menos de la mitad de lo que anunciaba la tasa.' : '.'}
              </p>
            </div>
          )}
        </section>
      )}

      <section className="glass-card p-6 md:p-8">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Inflación de referencia: {formatPorcentaje(INFLACION_ANUAL_REFERENCIA)} (IPC, DANE), corte {formatFecha(FECHA_CORTE_INFLACION)}.
          La retención en la fuente sobre rendimientos financieros varía según tu situación tributaria — validá la tarifa
          que te aplica con tu contador. Esta herramienta informa y compara; no es una recomendación de inversión.
        </p>
      </section>
    </div>
  );
}
