import React, { useMemo, useState } from 'react';
import { recalcularPortafolio, calcularInversionMaximaOptima, validarCDT, SMMLV_2026 } from '../OptimizationEngine';
import PortfolioChart from './PortfolioChart';
import { exportarPortafolioPDF } from '../pdfExport';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const FRECUENCIA_LABELS = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  al_vencimiento: 'Al Vencimiento'
};

const CAMPOS_INICIALES = {
  banco: '',
  valor: '',
  tasaEA: '',
  plazoMeses: '12',
  frecuenciaPago: 'al_vencimiento',
  fechaInicio: new Date().toISOString().split('T')[0]
};

const exportarCSV = (cdts, totales) => {
  const encabezado = [
    'Banco', 'Valor Invertido', 'Tasa EA (%)', 'Frecuencia', 'Plazo (meses)',
    'Fecha Inicio', 'Fecha Vencimiento', 'Intereses Brutos', 'Retencion (4%)',
    'Pago Salud', 'Pago Pension', 'Seguridad Social Total', 'Intereses Netos', 'Valor Final'
  ];

  const filas = cdts.map(cdt => [
    cdt.banco,
    cdt.valor,
    cdt.tasaEA,
    FRECUENCIA_LABELS[cdt.frecuenciaPago] || cdt.frecuenciaPago,
    cdt.plazoMeses,
    cdt.fechaInicio,
    cdt.fechaVencimiento,
    cdt.totalInteresBruto.toFixed(2),
    cdt.totalRetencion.toFixed(2),
    cdt.totalSalud.toFixed(2),
    cdt.totalPension.toFixed(2),
    cdt.totalSegSocial.toFixed(2),
    cdt.totalInteresNeto.toFixed(2),
    cdt.finalPlazo.toFixed(2)
  ]);

  filas.push([
    'TOTALES', totales.inversionTotal, '', '', '', '', '',
    totales.interesBrutoTotal.toFixed(2),
    totales.retencionTotal.toFixed(2),
    totales.saludTotal.toFixed(2),
    totales.pensionTotal.toFixed(2),
    totales.segSocialTotal.toFixed(2),
    totales.interesNetoTotal.toFixed(2),
    (totales.inversionTotal + totales.interesNetoTotal).toFixed(2)
  ]);

  const escaparCelda = (celda) => {
    const texto = String(celda ?? '');
    return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };

  const csv = [encabezado, ...filas]
    .map(fila => fila.map(escaparCelda).join(','))
    .join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `portafolio-cdts-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
};

export default function CDTSimulator() {
  const [rawCdts, setRawCdts] = useState([]);
  const [form, setForm] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [maxInversionCalc, setMaxInversionCalc] = useState(null);
  const [avisoTope, setAvisoTope] = useState('');

  const portfolioData = useMemo(() => {
    if (rawCdts.length === 0) return { cdts: [], totales: null };
    return recalcularPortafolio(rawCdts);
  }, [rawCdts]);

  const actualizarCampo = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
    if (errores[campo]) {
      setErrores(e => {
        const { [campo]: _omitido, ...resto } = e;
        return resto;
      });
    }
  };

  const handleAddCDT = (e) => {
    e.preventDefault();
    const erroresValidacion = validarCDT(form);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    const inversion = parseFloat(form.valor);
    const tasa = parseFloat(form.tasaEA);
    const plazo = parseInt(form.plazoMeses, 10);

    const fechaInicioObj = new Date(form.fechaInicio + 'T12:00:00');
    const fechaVencimientoObj = new Date(fechaInicioObj);
    fechaVencimientoObj.setMonth(fechaVencimientoObj.getMonth() + plazo);
    const fechaVencimiento = fechaVencimientoObj.toISOString().split('T')[0];

    const newCdt = {
      id: Date.now(),
      banco: form.banco.trim(),
      valor: inversion,
      tasaEA: tasa,
      frecuenciaPago: form.frecuenciaPago,
      plazoMeses: plazo,
      fechaInicio: form.fechaInicio,
      fechaVencimiento
    };

    setRawCdts(prev => [...prev, newCdt]);
    setForm(f => ({ ...CAMPOS_INICIALES, frecuenciaPago: f.frecuenciaPago, plazoMeses: f.plazoMeses }));
    setErrores({});
  };

  const handleRemoveCDT = (id) => {
    setRawCdts(prev => prev.filter(c => c.id !== id));
  };

  const handleCalcularMaximo = () => {
    const tasa = parseFloat(form.tasaEA);
    const plazo = parseInt(form.plazoMeses, 10) || 12;

    if (!form.tasaEA || Number.isNaN(tasa) || tasa <= 0) {
      setAvisoTope('Ingresa una tasa E.A. válida (mayor a 0) para calcular el tope.');
      setMaxInversionCalc(null);
      return;
    }

    setAvisoTope('');
    const max = calcularInversionMaximaOptima(tasa / 100, form.frecuenciaPago, plazo);
    setMaxInversionCalc(max);
  };

  const campoInvalido = (campo) => Boolean(errores[campo]);

  return (
    <div className="space-y-8">

      {/* Section 1: Optimization Calculator */}
      <section className="glass-card p-6 md:p-8 print:hidden">
        <h2 className="text-2xl font-bold mb-4 text-primary-900 dark:text-primary-100">Simulador &amp; Optimizador de CDT</h2>

        <form onSubmit={handleAddCDT} noValidate className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="banco" className="text-sm font-semibold">Banco / Entidad</label>
            <input
              id="banco"
              type="text"
              className="glass-input"
              value={form.banco}
              onChange={e => actualizarCampo('banco', e.target.value)}
              placeholder="Ej: Bancolombia"
              aria-invalid={campoInvalido('banco')}
              aria-describedby={campoInvalido('banco') ? 'banco-error' : undefined}
            />
            {campoInvalido('banco') && (
              <p id="banco-error" role="alert" className="text-xs text-red-600 dark:text-red-400">{errores.banco}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="valor" className="text-sm font-semibold">Valor Inversión (COP)</label>
            <input
              id="valor"
              type="number"
              min="0"
              step="1000"
              className="glass-input"
              value={form.valor}
              onChange={e => actualizarCampo('valor', e.target.value)}
              placeholder="Ej: 15000000"
              aria-invalid={campoInvalido('valor')}
              aria-describedby={campoInvalido('valor') ? 'valor-error' : undefined}
            />
            {form.valor && !campoInvalido('valor') && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(parseFloat(form.valor) || 0)}</p>
            )}
            {campoInvalido('valor') && (
              <p id="valor-error" role="alert" className="text-xs text-red-600 dark:text-red-400">{errores.valor}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="tasaEA" className="text-sm font-semibold">Tasa E.A (%)</label>
            <input
              id="tasaEA"
              type="number"
              step="0.01"
              min="0"
              className="glass-input"
              value={form.tasaEA}
              onChange={e => actualizarCampo('tasaEA', e.target.value)}
              placeholder="Ej: 11.5"
              aria-invalid={campoInvalido('tasaEA')}
              aria-describedby={campoInvalido('tasaEA') ? 'tasaEA-error' : undefined}
            />
            {campoInvalido('tasaEA') && (
              <p id="tasaEA-error" role="alert" className="text-xs text-red-600 dark:text-red-400">{errores.tasaEA}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="frecuenciaPago" className="text-sm font-semibold">Frecuencia de Pago</label>
            <select
              id="frecuenciaPago"
              className="glass-input"
              value={form.frecuenciaPago}
              onChange={e => actualizarCampo('frecuenciaPago', e.target.value)}
            >
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
              <option value="al_vencimiento">Al Vencimiento</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="plazoMeses" className="text-sm font-semibold">Plazo (Meses)</label>
            <input
              id="plazoMeses"
              type="number"
              min="1"
              className="glass-input"
              value={form.plazoMeses}
              onChange={e => actualizarCampo('plazoMeses', e.target.value)}
              aria-invalid={campoInvalido('plazoMeses')}
              aria-describedby={campoInvalido('plazoMeses') ? 'plazoMeses-error' : undefined}
            />
            {campoInvalido('plazoMeses') && (
              <p id="plazoMeses-error" role="alert" className="text-xs text-red-600 dark:text-red-400">{errores.plazoMeses}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="fechaInicio" className="text-sm font-semibold">Fecha de Inicio</label>
            <input
              id="fechaInicio"
              type="date"
              className="glass-input"
              value={form.fechaInicio}
              onChange={e => actualizarCampo('fechaInicio', e.target.value)}
              aria-invalid={campoInvalido('fechaInicio')}
              aria-describedby={campoInvalido('fechaInicio') ? 'fechaInicio-error' : undefined}
            />
            {campoInvalido('fechaInicio') && (
              <p id="fechaInicio-error" role="alert" className="text-xs text-red-600 dark:text-red-400">{errores.fechaInicio}</p>
            )}
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-4 mt-2">
            <button type="submit" className="btn-primary flex-1">
              Agregar CDT a la simulación
            </button>
            <button type="button" onClick={handleCalcularMaximo} className="btn-secondary flex-1 border-primary-500 text-primary-600 dark:text-primary-400">
              Calcular Tope Máximo (Sin SS)
            </button>
          </div>
        </form>

        {avisoTope && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{avisoTope}</p>
        )}

        {maxInversionCalc !== null && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-lg font-medium text-green-800 dark:text-green-300">
              Inversión máxima recomendada (Frecuencia: {FRECUENCIA_LABELS[form.frecuenciaPago]}): <span className="font-bold">{formatCurrency(maxInversionCalc)}</span>
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Con esta inversión, el interés recibido en cada pago no superará 1 SMMLV 2026 ({formatCurrency(SMMLV_2026)}), evitándote legalmente el pago de Salud y Pensión (asumiendo que no tienes otros CDTs).
            </p>
          </div>
        )}
      </section>

      {/* Section 2: Chart */}
      {portfolioData.totales && (
        <PortfolioChart flujoMensual={portfolioData.totales.flujoMensual} />
      )}

      {/* Section 3: Results Table */}
      {portfolioData.cdts.length > 0 && (
        <section className="glass-card p-6 md:p-8 overflow-x-auto space-y-6">

          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2 text-primary-900 dark:text-primary-100">Portafolio de CDTs (Consolidado)</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">El cálculo de Seguridad Social ahora analiza todos los CDTs del portafolio mes a mes de forma consolidada, tal como exige la UGPP.</p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={() => exportarCSV(portfolioData.cdts, portfolioData.totales)}
                className="btn-secondary whitespace-nowrap"
              >
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={() => exportarPortafolioPDF(portfolioData.cdts, portfolioData.totales)}
                className="btn-secondary whitespace-nowrap"
              >
                Descargar PDF
              </button>
            </div>
          </div>

          {/* Dynamic SS Notification Banner */}
          {portfolioData.totales.segSocialTotal > 0 ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">⚠️</span>
              <div>
                <p className="text-orange-900 dark:text-orange-200 font-semibold text-lg">
                  Atención: Estás activando pagos de Seguridad Social
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                  En uno o más meses de tu simulación, la suma de los intereses de todos tus CDTs supera 1 SMMLV ($1.750.905 COP).
                  Por obligación de la UGPP, pagarás un total acumulado de <span className="font-bold">{formatCurrency(portfolioData.totales.segSocialTotal)}</span> en Seguridad Social a lo largo de tu inversión.
                  Revisa las columnas de Salud y Pensión para ver la distribución exacta.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">✅</span>
              <div>
                <p className="text-green-900 dark:text-green-200 font-semibold text-lg">
                  ¡Excelente! Tu portafolio está optimizado
                </p>
                <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                  Tus vencimientos e intereses están distribuidos de forma que <strong>en ningún mes</strong> superas el tope de 1 SMMLV ($1.750.905 COP).
                  Por ende, tienes cero obligación de cotizar como rentista de capital bajo esta simulación.
                </p>
              </div>
            </div>
          )}

          <table className="w-full text-left text-sm whitespace-nowrap">
            <caption className="sr-only">Detalle del portafolio de CDTs con intereses, retenciones y seguridad social por entidad</caption>
            <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="py-3 px-4 rounded-tl-lg">Fecha Vencimiento</th>
                <th scope="col" className="py-3 px-4">Banco</th>
                <th scope="col" className="py-3 px-4">Valor Invertido</th>
                <th scope="col" className="py-3 px-4">Tasa EA</th>
                <th scope="col" className="py-3 px-4">Intereses Brutos</th>
                <th scope="col" className="py-3 px-4">Retención (4%)</th>
                <th scope="col" className="py-3 px-4 text-blue-600 dark:text-blue-400">Pago Salud (12.5%)</th>
                <th scope="col" className="py-3 px-4 text-purple-600 dark:text-purple-400">Pago Pensión (16%)</th>
                <th scope="col" className="py-3 px-4 text-orange-600 dark:text-orange-400">Seg. Social (Total)</th>
                <th scope="col" className="py-3 px-4 font-bold text-primary-600 dark:text-primary-400">Intereses Netos</th>
                <th scope="col" className="py-3 px-4">Final Plazo</th>
                <th scope="col" className="py-3 px-4 rounded-tr-lg print:hidden">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {portfolioData.cdts.map((cdt) => (
                <tr key={cdt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">{cdt.fechaVencimiento}</td>
                  <td className="py-4 px-4 font-medium">{cdt.banco}</td>
                  <td className="py-4 px-4">{formatCurrency(cdt.valor)}</td>
                  <td className="py-4 px-4">{cdt.tasaEA}% ({FRECUENCIA_LABELS[cdt.frecuenciaPago]})</td>
                  <td className="py-4 px-4 text-green-600 dark:text-green-400">{formatCurrency(cdt.totalInteresBruto)}</td>
                  <td className="py-4 px-4 text-red-500 dark:text-red-400">{formatCurrency(cdt.totalRetencion)}</td>
                  <td className="py-4 px-4 text-blue-600 dark:text-blue-400">{formatCurrency(cdt.totalSalud)}</td>
                  <td className="py-4 px-4 text-purple-600 dark:text-purple-400">{formatCurrency(cdt.totalPension)}</td>
                  <td className="py-4 px-4 text-orange-600 dark:text-orange-400 font-bold">{formatCurrency(cdt.totalSegSocial)}</td>
                  <td className="py-4 px-4 font-bold text-primary-600 dark:text-primary-400">{formatCurrency(cdt.totalInteresNeto)}</td>
                  <td className="py-4 px-4 font-bold">{formatCurrency(cdt.finalPlazo)}</td>
                  <td className="py-4 px-4 print:hidden">
                    <button
                      onClick={() => handleRemoveCDT(cdt.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      aria-label={`Eliminar CDT de ${cdt.banco}`}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                <td className="py-4 px-4" colSpan={2}>TOTALES PORTAFOLIO</td>
                <td className="py-4 px-4">{formatCurrency(portfolioData.totales.inversionTotal)}</td>
                <td className="py-4 px-4"></td>
                <td className="py-4 px-4 text-green-700 dark:text-green-400">{formatCurrency(portfolioData.totales.interesBrutoTotal)}</td>
                <td className="py-4 px-4 text-red-600 dark:text-red-400">{formatCurrency(portfolioData.totales.retencionTotal)}</td>
                <td className="py-4 px-4 text-blue-600 dark:text-blue-400">{formatCurrency(portfolioData.totales.saludTotal)}</td>
                <td className="py-4 px-4 text-purple-600 dark:text-purple-400">{formatCurrency(portfolioData.totales.pensionTotal)}</td>
                <td className="py-4 px-4 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 rounded-lg">{formatCurrency(portfolioData.totales.segSocialTotal)}</td>
                <td className="py-4 px-4 text-primary-700 dark:text-primary-400">{formatCurrency(portfolioData.totales.interesNetoTotal)}</td>
                <td className="py-4 px-4">{formatCurrency(portfolioData.totales.inversionTotal + portfolioData.totales.interesNetoTotal)}</td>
                <td className="py-4 px-4 print:hidden"></td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Info Notice */}
      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 text-sm text-blue-800 dark:text-blue-300 print:hidden">
        <p><strong>Nota Fiscal (Actualizada):</strong> La normativa de la UGPP requiere consolidar todos tus ingresos por rentas de capital en el mismo mes. El simulador ahora agrupa los pagos de todos tus CDTs mes a mes; si en un mes específico la suma de los intereses recibidos es mayor o igual a 1 SMMLV, calcula la Seguridad Social de ese mes y la distribuye (prorratea) entre los CDTs que pagaron en dicho mes.</p>
      </div>

    </div>
  );
}
