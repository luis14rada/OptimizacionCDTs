import React, { useState } from 'react';
import { evaluarObligacionRenta, calcularSancionMinima } from '../RentaEngine';
import { FUENTE_RENTA, parametrosRentaPorDefecto } from '../parametrosRenta';
import Campo from './Campo';

const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const CAMPOS_ENTRADA = [
  { clave: 'patrimonioBruto', etiqueta: 'Patrimonio bruto a 31 de diciembre', placeholder: 'Ej: 150000000' },
  { clave: 'ingresosBrutos', etiqueta: 'Ingresos brutos totales del año', placeholder: 'Ej: 40000000' },
  { clave: 'consumosTarjeta', etiqueta: 'Consumos con tarjeta de crédito', placeholder: 'Ej: 20000000' },
  { clave: 'comprasConsumos', etiqueta: 'Compras y consumos totales', placeholder: 'Ej: 20000000' },
  { clave: 'consignaciones', etiqueta: 'Consignaciones, depósitos o inversiones bancarias', placeholder: 'Ej: 40000000' }
];

const VALORES_INICIALES = CAMPOS_ENTRADA.reduce((acc, c) => ({ ...acc, [c.clave]: '' }), {});

export default function DeclararRenta() {
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [supuestos, setSupuestos] = useState(parametrosRentaPorDefecto());
  const [ajustarAbierto, setAjustarAbierto] = useState(false);

  const cambiarValor = (clave, v) => setValores(prev => ({ ...prev, [clave]: v }));
  const cambiarSupuesto = (clave, v) => setSupuestos(prev => ({ ...prev, [clave]: v }));

  const hayAlgunValor = CAMPOS_ENTRADA.some(c => parseFloat(valores[c.clave]) > 0);

  const valoresNum = CAMPOS_ENTRADA.reduce((acc, c) => ({ ...acc, [c.clave]: parseFloat(valores[c.clave]) || 0 }), {});
  const { uvt, uvtSancion, sancionMinimaUvt, ...topesUvt } = supuestos;

  const resultado = hayAlgunValor ? evaluarObligacionRenta(valoresNum, topesUvt, uvt) : null;
  const sancionMinima = calcularSancionMinima(uvtSancion, sancionMinimaUvt);

  return (
    <div className="space-y-8">
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary-900 dark:text-primary-100">¿Me toca declarar renta?</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            Para el año gravable {supuestos.anioGravable} (declaración en {supuestos.anioGravable + 1}), la ley exige
            declarar renta a quien supere <strong>al menos uno</strong> de estos cinco topes -- no hace falta superarlos
            todos. Ingresá tus valores del año para revisar cada criterio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CAMPOS_ENTRADA.map(c => (
            <div key={c.clave} className="space-y-2">
              <label htmlFor={c.clave} className="text-sm font-semibold">{c.etiqueta}</label>
              <input
                id={c.clave}
                type="number"
                min="0"
                step="1000"
                className="glass-input"
                value={valores[c.clave]}
                onChange={e => cambiarValor(c.clave, e.target.value)}
                placeholder={c.placeholder}
              />
            </div>
          ))}
        </div>
      </section>

      {resultado && (
        <section className={`glass-card p-6 md:p-8 space-y-4 border ${resultado.obligado ? 'border-orange-200 dark:border-orange-800' : 'border-green-200 dark:border-green-800'}`}>
          {resultado.obligado ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">⚠️</span>
              <div>
                <p className="text-orange-900 dark:text-orange-200 font-semibold text-lg">Quedás obligado a declarar renta</p>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                  Superaste {resultado.criteriosSuperados.length === 1 ? 'este criterio' : 'estos criterios'}:{' '}
                  {resultado.criteriosSuperados.map(c => c.etiqueta.toLowerCase()).join(', ')}.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">✅</span>
              <div>
                <p className="text-green-900 dark:text-green-200 font-semibold text-lg">No quedás obligado a declarar renta</p>
                <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                  Con los valores ingresados, ningún criterio supera su tope. Podés declarar de todas formas de forma
                  voluntaria (por ejemplo, para recuperar retenciones).
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Detalle de los cinco criterios de obligación a declarar renta</caption>
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className="py-2 pr-4">Criterio</th>
                  <th scope="col" className="py-2 px-4">Tu valor</th>
                  <th scope="col" className="py-2 px-4">Tope</th>
                  <th scope="col" className="py-2 pl-4">¿Superado?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {resultado.detalle.map(d => (
                  <tr key={d.clave}>
                    <td className="py-2 pr-4">{d.etiqueta}</td>
                    <td className="py-2 px-4 tabular-nums">{formatCurrency(d.valor)}</td>
                    <td className="py-2 px-4 tabular-nums">{formatCurrency(d.topePesos)}</td>
                    <td className="py-2 pl-4">{d.superado ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => setAjustarAbierto(a => !a)}
          aria-expanded={ajustarAbierto}
          aria-controls="ajustar-renta"
          className="w-full flex items-center justify-between gap-4 p-5 md:px-8 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div className="min-w-0">
            <h3 className="text-base font-bold text-primary-900 dark:text-primary-100">Supuestos legales usados</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">UVT {supuestos.uvt.toLocaleString('es-CO')} · Año gravable {supuestos.anioGravable}</p>
          </div>
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400 shrink-0">{ajustarAbierto ? 'Ocultar' : 'Ajustar'}</span>
        </button>

        {ajustarAbierto && (
          <div id="ajustar-renta" className="px-5 md:px-8 pb-6 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Si la DIAN publica una UVT o unos topes distintos, ajustalos acá para simular el escenario -- por defecto
              vienen con los valores oficiales verificados.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Campo etiqueta="UVT del año gravable" htmlFor="uvt-renta">
                <input id="uvt-renta" type="number" className="glass-input" value={supuestos.uvt}
                  onChange={e => cambiarSupuesto('uvt', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="UVT del año en que se declara" ayuda="Se usa para la sanción mínima." htmlFor="uvt-sancion-renta">
                <input id="uvt-sancion-renta" type="number" className="glass-input" value={supuestos.uvtSancion}
                  onChange={e => cambiarSupuesto('uvtSancion', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="Sanción mínima (UVT)" htmlFor="sancion-uvt-renta">
                <input id="sancion-uvt-renta" type="number" className="glass-input" value={supuestos.sancionMinimaUvt}
                  onChange={e => cambiarSupuesto('sancionMinimaUvt', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="Tope patrimonio bruto (UVT)" htmlFor="tope-patrimonio">
                <input id="tope-patrimonio" type="number" className="glass-input" value={supuestos.topePatrimonioBrutoUvt}
                  onChange={e => cambiarSupuesto('topePatrimonioBrutoUvt', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="Tope ingresos brutos (UVT)" htmlFor="tope-ingresos">
                <input id="tope-ingresos" type="number" className="glass-input" value={supuestos.topeIngresosBrutosUvt}
                  onChange={e => cambiarSupuesto('topeIngresosBrutosUvt', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="Tope consumos tarjeta (UVT)" htmlFor="tope-tarjeta">
                <input id="tope-tarjeta" type="number" className="glass-input" value={supuestos.topeConsumosTarjetaUvt}
                  onChange={e => cambiarSupuesto('topeConsumosTarjetaUvt', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="Tope compras y consumos (UVT)" htmlFor="tope-compras">
                <input id="tope-compras" type="number" className="glass-input" value={supuestos.topeComprasConsumosUvt}
                  onChange={e => cambiarSupuesto('topeComprasConsumosUvt', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="Tope consignaciones (UVT)" htmlFor="tope-consignaciones">
                <input id="tope-consignaciones" type="number" className="glass-input" value={supuestos.topeConsignacionesUvt}
                  onChange={e => cambiarSupuesto('topeConsignacionesUvt', parseFloat(e.target.value) || 0)} />
              </Campo>
            </div>
          </div>
        )}
      </section>

      <section className="glass-card p-6 md:p-8 space-y-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Si declarás tarde, la sanción mínima por extemporaneidad es {formatCurrency(sancionMinima)}{' '}
          ({supuestos.sancionMinimaUvt} UVT del año en que presentás, aunque la declaración dé saldo a favor o en ceros).
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Fuente: {FUENTE_RENTA} Esta herramienta evalúa los cinco topes generales; no cubre todas las excepciones (por
          ejemplo, responsables de IVA o ingresos por servicios digitales del exterior tienen obligación adicional
          aunque no superen estos topes). Validá siempre tu caso con un contador antes de decidir no declarar.
        </p>
      </section>
    </div>
  );
}
