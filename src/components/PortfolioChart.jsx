import React from 'react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatMes = (mesKey) => {
  const [anio, mes] = mesKey.split('-');
  const nombreMes = MESES_CORTOS[Number(mes) - 1];
  return `${nombreMes} ${anio.slice(2)}`;
};

/*
 * Paleta de la desagregación: un color por CDT.
 *
 * Las clases van escritas completas y no armadas por interpolación porque el
 * escáner de Tailwind no detecta nombres construidos en tiempo de ejecución
 * (`bg-${color}-700` no genera nada y el segmento saldría sin fondo).
 *
 * Los tonos están elegidos para que el texto que va DENTRO del segmento pase
 * el 4,5:1 de WCAG AA: en claro son tonos 700 con texto blanco (el más bajo
 * es ámbar, 5,05:1) y en oscuro son tonos 400 con texto slate-900 (el más
 * bajo es violeta, 6,0:1). Los tonos 500, que serían los naturales, quedaban
 * en 2,5:1 con texto blanco.
 */
const PALETA = [
  'bg-sky-700 dark:bg-sky-400',
  'bg-violet-700 dark:bg-violet-400',
  'bg-amber-700 dark:bg-amber-400',
  'bg-emerald-700 dark:bg-emerald-400',
  'bg-rose-700 dark:bg-rose-400',
  'bg-cyan-700 dark:bg-cyan-400',
  'bg-fuchsia-700 dark:bg-fuchsia-400',
  'bg-lime-700 dark:bg-lime-400'
];

const nombreDe = (banco) => (banco || '').trim() || 'CDT';

/**
 * Asigna color y etiqueta estables a cada CDT que aparece en el flujo.
 *
 * El orden es el de primera aparición recorriendo los meses, así que el color
 * de un CDT no cambia entre meses. Dos CDTs del mismo banco se numeran para
 * que la leyenda no muestre dos entradas idénticas de colores distintos.
 */
const construirLeyenda = (flujoMensual) => {
  const orden = [];
  for (const mes of flujoMensual) {
    for (const aporte of mes.aportes || []) {
      if (!orden.some(o => o.cdtId === aporte.cdtId)) {
        orden.push({ cdtId: aporte.cdtId, banco: nombreDe(aporte.banco) });
      }
    }
  }

  const repeticiones = {};
  for (const o of orden) repeticiones[o.banco] = (repeticiones[o.banco] || 0) + 1;

  const vistos = {};
  return orden.map((o, i) => {
    let etiqueta = o.banco;
    if (repeticiones[o.banco] > 1) {
      vistos[o.banco] = (vistos[o.banco] || 0) + 1;
      etiqueta = `${etiqueta} (${vistos[o.banco]})`;
    }
    return { cdtId: o.cdtId, etiqueta, color: PALETA[i % PALETA.length] };
  });
};

export default function PortfolioChart({ flujoMensual, smmlv }) {
  if (!flujoMensual || flujoMensual.length === 0) return null;

  const maxValor = Math.max(smmlv, ...flujoMensual.map(f => f.ingresoBrutoMes)) * 1.08;
  const topePorcentaje = (smmlv / maxValor) * 100;

  // Cuando ningún mes se acerca al tope, la línea de referencia queda pegada
  // al borde derecho y su etiqueta se salía de la página. Pasada la mitad,
  // la etiqueta se dibuja hacia la izquierda de la línea.
  const etiquetaTopeALaIzquierda = topePorcentaje > 55;

  const leyenda = construirLeyenda(flujoMensual);
  const porCdt = new Map(leyenda.map(l => [l.cdtId, l]));

  // Un mes sin desglose se dibuja como un solo bloque anónimo, en vez de
  // quedar como una barra vacía.
  const segmentosDe = (mes) => {
    const aportes = mes.aportes && mes.aportes.length > 0
      ? mes.aportes
      : [{ cdtId: null, interesBruto: mes.ingresoBrutoMes }];

    return aportes.map(aporte => {
      const info = porCdt.get(aporte.cdtId);
      return {
        cdtId: aporte.cdtId,
        etiqueta: info ? info.etiqueta : null,
        color: info ? info.color : PALETA[0],
        interesBruto: aporte.interesBruto,
        porcentajeDelMes: mes.ingresoBrutoMes > 0 ? (aporte.interesBruto / mes.ingresoBrutoMes) * 100 : 0
      };
    });
  };

  return (
    <section className="glass-card p-6 md:p-8 space-y-5" aria-labelledby="chart-title">
      <div>
        <h3 id="chart-title" className="text-xl font-bold text-primary-900 dark:text-primary-100">
          Flujo de intereses brutos por mes
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Intereses de tus CDTs en cada mes, desagregados por el CDT que los paga. La línea punteada marca
          1 SMMLV, el tope que activa seguridad social para un rentista de capital.
        </p>
      </div>

      {/* Leyenda: el color nunca es la única señal, siempre va acompañado de texto */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
        {leyenda.map(item => (
          <span key={item.cdtId} className="inline-flex items-center gap-2">
            <span className={`w-3 h-3 rounded-sm shrink-0 ${item.color}`} aria-hidden="true"></span>
            {item.etiqueta}
          </span>
        ))}
        <span className="inline-flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm shrink-0 ring-2 ring-orange-600 dark:ring-orange-400"
            aria-hidden="true"
          ></span>
          Este mes genera aportes a seguridad social
        </span>
      </div>

      {/*
        Las barras solo llevan el dato en `title`, que los lectores de pantalla
        no anuncian de forma fiable -- se ocultan del árbol de accesibilidad y
        la tabla de abajo queda como la única fuente de verdad para ese caso.
      */}
      <div className="relative pl-2 pr-1" aria-hidden="true">
        {/* Línea de referencia del tope de 1 SMMLV */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-400 dark:border-slate-500 z-10"
          style={{ left: `calc(${Math.min(topePorcentaje, 100)}% + 0.5rem)` }}
          aria-hidden="true"
        >
          <span className={`absolute -top-1 text-[10px] whitespace-nowrap text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 px-1 rounded ${
            etiquetaTopeALaIzquierda ? 'right-1' : 'left-1'
          }`}>
            Tope 1 SMMLV ({formatCurrency(smmlv)})
          </span>
        </div>

        <ul className="space-y-3 pt-6">
          {flujoMensual.map((mes) => {
            const anchoPorcentaje = Math.max((mes.ingresoBrutoMes / maxValor) * 100, 1.5);
            const anchoDibujado = Math.min(anchoPorcentaje, 100);
            const segmentos = segmentosDe(mes);

            return (
              <li key={mes.mesKey} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs text-slate-500 dark:text-slate-400 text-right capitalize">
                  {formatMes(mes.mesKey)}
                </span>
                <div className="relative flex-1 h-6 rounded bg-slate-100 dark:bg-slate-800/60">
                  {/*
                    El aro naranja va en la barra dibujada, no en la pista: en
                    la pista abarcaba todo el ancho y se leía como si el mes
                    llegara al tope máximo de la escala.
                  */}
                  <div
                    className={`flex h-full rounded-r-md overflow-hidden ${
                      mes.excedeTope ? 'ring-2 ring-orange-600 dark:ring-orange-400' : ''
                    }`}
                    style={{ width: `${anchoDibujado}%` }}
                  >
                    {segmentos.map((seg, i) => {
                      // El nombre solo cabe si el segmento ocupa una porción
                      // real del ancho total, no solo del mes: un 40% de una
                      // barra corta sigue siendo una astilla de pocos píxeles.
                      const anchoTotal = (seg.porcentajeDelMes * anchoDibujado) / 100;
                      // El tooltip conserva el dato del mes completo además del
                      // desglose: al pasar el mouse por un segmento se sigue
                      // viendo si ese mes activa seguridad social, que es la
                      // consecuencia de más peso de toda la pestaña.
                      const contexto = `${formatCurrency(mes.ingresoBrutoMes)} en el mes${
                        mes.excedeTope ? ` · Seg. social ${formatCurrency(mes.segSocialMes)}` : ' · sin seguridad social'
                      }`;
                      const titulo = seg.etiqueta
                        ? `${formatMes(mes.mesKey)} · ${seg.etiqueta}: ${formatCurrency(seg.interesBruto)} (${seg.porcentajeDelMes.toFixed(0)}% del mes) · ${contexto}`
                        : `${formatMes(mes.mesKey)}: ${contexto}`;

                      return (
                        <div
                          key={seg.cdtId ?? i}
                          className={`h-full flex items-center overflow-hidden border-r border-white/50 dark:border-slate-900/50 last:border-r-0 text-white dark:text-slate-900 ${seg.color}`}
                          style={{ width: `${seg.porcentajeDelMes}%` }}
                          title={titulo}
                        >
                          {seg.etiqueta && anchoTotal >= 8 && (
                            <span className="px-1.5 text-[10px] font-medium truncate">{seg.etiqueta}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* w-24 en móvil: con w-28 fijo la fila desbordaba 6px y metía scroll
                    horizontal en toda la página a 375px de ancho. */}
                <span className="w-24 sm:w-28 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                  {formatCurrency(mes.ingresoBrutoMes)}
                  {mes.excedeTope && (
                    <span className="block text-[10px] font-semibold text-orange-700 dark:text-orange-300">
                      paga seg. social
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/*
        Alternativa accesible al gráfico: mismos datos, oculta visualmente.
        El `sr-only` va en el div contenedor, no en el <table> directamente:
        una tabla no se deja encoger a 1px por CSS porque su ancho mínimo lo
        marca el contenido, así que puesto en la tabla misma queda con una
        caja real (medido: 659×336px) que generaba scroll horizontal en toda
        la página.
      */}
      <div className="sr-only">
        <table>
          <caption>
            Flujo de intereses brutos por mes, desagregado por CDT, con el tope de 1 SMMLV
            ({formatCurrency(smmlv)}) como referencia
          </caption>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Intereses brutos</th>
              <th scope="col">Desglose por CDT</th>
              <th scope="col">¿Genera aportes a seguridad social?</th>
              <th scope="col">Seguridad social</th>
            </tr>
          </thead>
          <tbody>
            {flujoMensual.map((mes) => (
              <tr key={mes.mesKey}>
                <td>{formatMes(mes.mesKey)}</td>
                <td>{formatCurrency(mes.ingresoBrutoMes)}</td>
                <td>
                  {(mes.aportes || []).length > 0
                    ? (mes.aportes || [])
                      .map(a => `${porCdt.get(a.cdtId)?.etiqueta || nombreDe(a.banco)}: ${formatCurrency(a.interesBruto)}`)
                      .join(' · ')
                    : '—'}
                </td>
                <td>{mes.excedeTope ? 'Sí' : 'No'}</td>
                <td>{mes.segSocialMes > 0 ? formatCurrency(mes.segSocialMes) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
