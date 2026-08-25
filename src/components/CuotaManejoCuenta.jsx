import React, { useState } from 'react';
import { calcularCostoAnualCuenta } from '../CuentaEngine';
import { CUOTAS_MANEJO, ENTIDADES_SIN_CUOTA_CONOCIDAS, FECHA_CORTE_CUOTAS, FUENTE_CUOTAS, FUENTE_CUOTAS_URL } from '../parametrosCuentas';

const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
const formatFecha = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { dateStyle: 'long' });

export default function CuotaManejoCuenta() {
  const [cuotaCuenta, setCuotaCuenta] = useState('');
  const [cuotaTarjeta, setCuotaTarjeta] = useState('');

  const cuentaNum = parseFloat(cuotaCuenta) || 0;
  const tarjetaNum = parseFloat(cuotaTarjeta) || 0;
  const totalMensual = cuentaNum + tarjetaNum;
  const hayDatos = cuotaCuenta !== '' || cuotaTarjeta !== '';

  const costoAnual = calcularCostoAnualCuenta(totalMensual);

  return (
    <div className="space-y-8">
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary-900 dark:text-primary-100">Costo total de tener una cuenta</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            Entre cuota de manejo de la cuenta y de la tarjeta débito, algunos bancos cobran hasta{' '}
            {formatCurrency(44030 + 24150)} al mes por tener tu plata guardada -- otros no cobran nada. Ingresá lo que te
            cobra tu banco (revisá tu extracto o el tarifario) para ver cuánto es al año.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="cuota-cuenta" className="text-sm font-semibold">Cuota de manejo de la cuenta (COP/mes)</label>
            <input
              id="cuota-cuenta"
              type="number"
              min="0"
              step="500"
              className="glass-input"
              value={cuotaCuenta}
              onChange={e => setCuotaCuenta(e.target.value)}
              placeholder="Ej: 13500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="cuota-tarjeta" className="text-sm font-semibold">Cuota de manejo de la tarjeta débito (COP/mes)</label>
            <input
              id="cuota-tarjeta"
              type="number"
              min="0"
              step="500"
              className="glass-input"
              value={cuotaTarjeta}
              onChange={e => setCuotaTarjeta(e.target.value)}
              placeholder="Ej: 0"
            />
          </div>
        </div>
      </section>

      {hayDatos && (
        <section className="glass-card p-6 md:p-8 space-y-4">
          <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100">Lo que te cuesta al año</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Total mensual</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(totalMensual)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Total al año</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(costoAnual)}</p>
            </div>
          </div>

          {costoAnual > 0 ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">⚠️</span>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Pagás <strong>{formatCurrency(costoAnual)}</strong> al año solo por tener la cuenta abierta. Varias entidades
                en el mercado colombiano no cobran nada por esto -- vale la pena comparar antes de asumir que es normal.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">✅</span>
              <p className="text-sm text-green-800 dark:text-green-300">Tu cuenta no te cuesta nada por tenerla abierta.</p>
            </div>
          )}
        </section>
      )}

      <section className="glass-card p-6 md:p-8 overflow-x-auto space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-1 text-primary-900 dark:text-primary-100">Referencia del mercado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Las cuotas más altas reportadas por la Superfinanciera -- no es un listado completo de los 25 bancos del
            reporte, solo de los que sí cobran. Si tu banco no aparece, puede que no cobre nada; confirmalo con tu extracto.
          </p>
        </div>

        <table className="w-full text-left text-sm">
          <caption className="sr-only">Cuotas de manejo de cuenta y tarjeta débito por entidad</caption>
          <thead className="border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" className="py-2 pr-4">Entidad</th>
              <th scope="col" className="py-2 px-4">Cuota de cuenta</th>
              <th scope="col" className="py-2 pl-4">Cuota de tarjeta débito</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {CUOTAS_MANEJO.map(e => (
              <tr key={e.entidad}>
                <td className="py-2 pr-4">{e.entidad}</td>
                <td className="py-2 px-4 tabular-nums">{e.cuotaCuenta != null ? formatCurrency(e.cuotaCuenta) : '—'}</td>
                <td className="py-2 pl-4 tabular-nums">{e.cuotaTarjeta != null ? formatCurrency(e.cuotaTarjeta) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Conocidas por no cobrar cuota de manejo: {ENTIDADES_SIN_CUOTA_CONOCIDAS.join(', ')}.
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Fuente: <a href={FUENTE_CUOTAS_URL} target="_blank" rel="noreferrer" className="underline">{FUENTE_CUOTAS}</a>,
          corte {formatFecha(FECHA_CORTE_CUOTAS)}. Esta tabla informa y compara; no es una recomendación de dónde abrir tu
          cuenta -- validá siempre la tarifa vigente directamente con la entidad.
        </p>
      </section>
    </div>
  );
}
