import React, { useState } from 'react';
import { calcularFondoEmergencia } from '../FondoEmergenciaEngine';
import {
  MESES_MINIMO_RECOMENDADO,
  MESES_MAXIMO_RECOMENDADO,
  FUENTE_ESTADISTICA,
  FECHA_ESTADISTICA,
  PROPORCION_PUEDE_CUBRIR_IMPREVISTO
} from '../parametrosFondoEmergencia';

const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
const formatFecha = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { dateStyle: 'long' });
const formatPorcentaje = (v) => `${(v * 100).toFixed(0)}%`;

export default function FondoEmergencia() {
  const [gastos, setGastos] = useState('');
  const [ahorro, setAhorro] = useState('');
  const [mesesObjetivo, setMesesObjetivo] = useState(MESES_MINIMO_RECOMENDADO);

  const gastosNum = parseFloat(gastos) || 0;
  const ahorroNum = parseFloat(ahorro) || 0;
  const hayDatos = gastosNum > 0;

  const resultado = hayDatos
    ? calcularFondoEmergencia({ gastosMensuales: gastosNum, mesesObjetivo, ahorroActual: ahorroNum })
    : null;

  return (
    <div className="space-y-8">
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary-900 dark:text-primary-100">Fondo de emergencia</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            Apenas {formatPorcentaje(PROPORCION_PUEDE_CUBRIR_IMPREVISTO)} de los colombianos podría asumir un gasto
            imprevisto importante, según {FUENTE_ESTADISTICA} ({formatFecha(FECHA_ESTADISTICA)}). No es una obligación
            legal, es planeación financiera: la práctica más usada recomienda tener entre {MESES_MINIMO_RECOMENDADO} y{' '}
            {MESES_MAXIMO_RECOMENDADO} meses de tus gastos fijos guardados, sin tocar, para imprevistos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="gastos-mensuales" className="text-sm font-semibold">Gastos fijos mensuales (COP)</label>
            <input
              id="gastos-mensuales"
              type="number"
              min="0"
              step="10000"
              className="glass-input"
              value={gastos}
              onChange={e => setGastos(e.target.value)}
              placeholder="Ej: 2000000"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ahorro-actual" className="text-sm font-semibold">Ahorro que ya tienes para esto (COP)</label>
            <input
              id="ahorro-actual"
              type="number"
              min="0"
              step="10000"
              className="glass-input"
              value={ahorro}
              onChange={e => setAhorro(e.target.value)}
              placeholder="Ej: 1000000"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="meses-objetivo" className="text-sm font-semibold">Meses de cobertura que quieres</label>
            <input
              id="meses-objetivo"
              type="number"
              min="1"
              step="1"
              className="glass-input"
              value={mesesObjetivo}
              onChange={e => setMesesObjetivo(parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Estándar: {MESES_MINIMO_RECOMENDADO} a {MESES_MAXIMO_RECOMENDADO} meses.</p>
          </div>
        </div>
      </section>

      {resultado && (
        <section className="glass-card p-6 md:p-8 space-y-4">
          <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100">Tu meta de fondo de emergencia</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Meta ({mesesObjetivo} {mesesObjetivo === 1 ? 'mes' : 'meses'} de gastos)</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(resultado.montoObjetivo)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Te falta ahorrar</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(resultado.faltante)}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Progreso</span>
              <span>{resultado.porcentajeCompletado.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden" role="progressbar" aria-valuenow={Math.round(resultado.porcentajeCompletado)} aria-valuemin="0" aria-valuemax="100">
              <div className="h-full bg-primary-600 dark:bg-primary-400 rounded-full" style={{ width: `${resultado.porcentajeCompletado}%` }} />
            </div>
          </div>

          {resultado.faltante === 0 ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">✅</span>
              <p className="text-sm text-green-800 dark:text-green-300">
                Ya tienes cubierta tu meta de {mesesObjetivo} {mesesObjetivo === 1 ? 'mes' : 'meses'} de gastos.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Hoy tienes cubiertos {resultado.mesesCubiertosHoy.toFixed(1)} {resultado.mesesCubiertosHoy === 1 ? 'mes' : 'meses'} de gastos.
            </p>
          )}
        </section>
      )}

      <section className="glass-card p-6 md:p-8">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Esta pestaña no cita una norma: la cantidad de meses recomendada es una práctica de planeación financiera
          personal, no una obligación legal. La estadística de vulnerabilidad ante imprevistos es de {FUENTE_ESTADISTICA},{' '}
          {formatFecha(FECHA_ESTADISTICA)}. Esta herramienta informa; no es asesoría financiera.
        </p>
      </section>
    </div>
  );
}
