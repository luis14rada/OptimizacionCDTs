import React from 'react';
import { SITUACIONES_LABORALES } from '../parametros';

const moneda = (v) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
}).format(v || 0);

const porcentaje = (v) => `${(v * 100).toFixed(2).replace(/\.?0+$/, '')}%`;

/**
 * Filas comparadas. `mejorEs` indica qué dirección es favorable para el usuario,
 * para poder colorear la diferencia sin que tenga que interpretarla.
 */
const FILAS = [
  { clave: 'inversionTotal',    etiqueta: 'Inversión total',      mejorEs: null },
  { clave: 'interesBrutoTotal', etiqueta: 'Intereses brutos',     mejorEs: 'mayor' },
  { clave: 'retencionTotal',    etiqueta: 'Retención en la fuente', mejorEs: 'menor' },
  { clave: 'segSocialTotal',    etiqueta: 'Seguridad social',     mejorEs: 'menor' },
  { clave: 'interesNetoTotal',  etiqueta: 'Intereses netos',      mejorEs: 'mayor', destacado: true }
];

function Diferencia({ valor, mejorEs }) {
  if (Math.abs(valor) < 1) {
    return <span className="text-slate-400">sin diferencia</span>;
  }

  const esFavorable = mejorEs === null
    ? null
    : (mejorEs === 'mayor' ? valor > 0 : valor < 0);

  const color = esFavorable === null
    ? 'text-slate-600 dark:text-slate-300'
    : esFavorable
      ? 'text-green-700 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <span className={`font-semibold ${color}`}>
      {valor > 0 ? '+' : '−'}{moneda(Math.abs(valor)).replace('-', '')}
    </span>
  );
}

function ResumenSupuestos({ parametros }) {
  const situacion = SITUACIONES_LABORALES[parametros.situacionLaboral] || SITUACIONES_LABORALES.rentista;
  return (
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
      {parametros.anioGravable} · Retención {porcentaje(parametros.retencion)} · {situacion.etiqueta}
      {parametros.componenteInflacionarioActivo && ` · Comp. inflacionario ${porcentaje(parametros.componenteInflacionario)}`}
    </p>
  );
}

export default function ComparadorEscenarios({ escenarioA, escenarioB, resultadoA, resultadoB }) {
  const totalesA = resultadoA?.totales;
  const totalesB = resultadoB?.totales;

  if (!totalesA || !totalesB) {
    return (
      <section className="glass-card p-6 md:p-8 print:hidden">
        <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100 mb-2">Comparación de escenarios</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Agrega al menos un CDT en cada escenario para poder compararlos.
        </p>
      </section>
    );
  }

  const finalA = totalesA.inversionTotal + totalesA.interesNetoTotal;
  const finalB = totalesB.inversionTotal + totalesB.interesNetoTotal;
  const diferenciaNeta = totalesB.interesNetoTotal - totalesA.interesNetoTotal;

  return (
    <section className="glass-card p-6 md:p-8 space-y-5 overflow-x-auto print:hidden" aria-labelledby="titulo-comparacion">
      <div>
        <h3 id="titulo-comparacion" className="text-xl font-bold text-primary-900 dark:text-primary-100">
          Comparación de escenarios
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          La diferencia se calcula como escenario B menos escenario A.
        </p>
      </div>

      <div className={`p-4 rounded-xl border ${
        diferenciaNeta >= 0
          ? 'bg-green-50 dark:bg-green-900/25 border-green-200 dark:border-green-800'
          : 'bg-orange-50 dark:bg-orange-900/25 border-orange-200 dark:border-orange-800'
      }`}>
        <p className={`font-semibold ${diferenciaNeta >= 0 ? 'text-green-900 dark:text-green-200' : 'text-orange-900 dark:text-orange-200'}`}>
          {Math.abs(diferenciaNeta) < 1
            ? 'Ambos escenarios dejan prácticamente lo mismo.'
            : diferenciaNeta > 0
              ? `${escenarioB.nombre} te deja ${moneda(diferenciaNeta)} más en intereses netos.`
              : `${escenarioA.nombre} te deja ${moneda(Math.abs(diferenciaNeta))} más en intereses netos.`}
        </p>
      </div>

      <table className="w-full text-left text-sm">
        <caption className="sr-only">Comparación de totales entre los dos escenarios</caption>
        <thead className="border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th scope="col" className="py-3 pr-4">Concepto</th>
            <th scope="col" className="py-3 px-4">
              {escenarioA.nombre}
              <ResumenSupuestos parametros={totalesA.parametros} />
            </th>
            <th scope="col" className="py-3 px-4">
              {escenarioB.nombre}
              <ResumenSupuestos parametros={totalesB.parametros} />
            </th>
            <th scope="col" className="py-3 pl-4">Diferencia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {FILAS.map(fila => (
            <tr key={fila.clave} className={fila.destacado ? 'bg-slate-50 dark:bg-slate-800/40 font-semibold' : ''}>
              <th scope="row" className="py-3 pr-4 font-medium text-left">{fila.etiqueta}</th>
              <td className="py-3 px-4 tabular-nums">{moneda(totalesA[fila.clave])}</td>
              <td className="py-3 px-4 tabular-nums">{moneda(totalesB[fila.clave])}</td>
              <td className="py-3 pl-4 tabular-nums">
                <Diferencia valor={totalesB[fila.clave] - totalesA[fila.clave]} mejorEs={fila.mejorEs} />
              </td>
            </tr>
          ))}
          <tr className="bg-primary-50 dark:bg-primary-900/20 font-bold">
            <th scope="row" className="py-3 pr-4 text-left">Valor final</th>
            <td className="py-3 px-4 tabular-nums">{moneda(finalA)}</td>
            <td className="py-3 px-4 tabular-nums">{moneda(finalB)}</td>
            <td className="py-3 pl-4 tabular-nums">
              <Diferencia valor={finalB - finalA} mejorEs="mayor" />
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
