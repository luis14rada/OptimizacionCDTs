/**
 * Motor de la obligación de declarar renta como persona natural (art. 592-593
 * del Estatuto Tributario). Basta con superar UNO de los cinco topes para
 * quedar obligado -- no hace falta superarlos todos.
 */

const CRITERIOS = [
  { clave: 'patrimonioBruto', etiqueta: 'Patrimonio bruto a 31 de diciembre', topeClave: 'topePatrimonioBrutoUvt' },
  { clave: 'ingresosBrutos', etiqueta: 'Ingresos brutos totales del año', topeClave: 'topeIngresosBrutosUvt' },
  { clave: 'consumosTarjeta', etiqueta: 'Consumos con tarjeta de crédito', topeClave: 'topeConsumosTarjetaUvt' },
  { clave: 'comprasConsumos', etiqueta: 'Compras y consumos totales', topeClave: 'topeComprasConsumosUvt' },
  { clave: 'consignaciones', etiqueta: 'Consignaciones, depósitos o inversiones bancarias', topeClave: 'topeConsignacionesUvt' }
];

/**
 * Evalúa los cinco topes contra los valores que ingresó la persona.
 * `valores` y `topesUvt` usan las mismas claves que `CRITERIOS`. Devuelve
 * el detalle de cada criterio (su tope en pesos y si lo superó) para poder
 * explicar exactamente cuál activó la obligación, no solo el resultado final.
 */
export const evaluarObligacionRenta = (valores, topesUvt, uvt) => {
  const detalle = CRITERIOS.map(({ clave, etiqueta, topeClave }) => {
    const topePesos = topesUvt[topeClave] * uvt;
    const valor = valores[clave] || 0;
    return { clave, etiqueta, topePesos, valor, superado: valor >= topePesos };
  });

  return {
    detalle,
    obligado: detalle.some(d => d.superado),
    criteriosSuperados: detalle.filter(d => d.superado)
  };
};

/** Sanción mínima (art. 639 ET) con la UVT vigente al momento de declarar. */
export const calcularSancionMinima = (uvtSancion, sancionMinimaUvt) => uvtSancion * sancionMinimaUvt;

export { CRITERIOS };
