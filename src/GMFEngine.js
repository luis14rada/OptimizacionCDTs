/**
 * Motor del Gravamen a los Movimientos Financieros (GMF, "4x1000"). Solo se
 * grava el excedente sobre el tope exento mensual, no el mes completo una
 * vez superado -- así lo confirma la exención del art. 879 numeral 1 ET.
 */

/** GMF de un mes, con o sin la cuenta marcada como exenta. */
export const calcularGMFMensual = ({ movimientoMensual, cuentaMarcada, tarifa, topeExentoUvt, uvt }) => {
  const topeExento = topeExentoUvt * uvt;
  const baseGravada = cuentaMarcada ? Math.max(0, movimientoMensual - topeExento) : movimientoMensual;
  return {
    topeExento,
    baseGravada,
    gmfMensual: baseGravada * tarifa
  };
};

/** Compara el año con y sin la cuenta marcada, y el ahorro de hacerlo. */
export const calcularAhorroPorMarcarCuenta = ({ movimientoMensual, tarifa, topeExentoUvt, uvt }) => {
  const sinMarcar = calcularGMFMensual({ movimientoMensual, cuentaMarcada: false, tarifa, topeExentoUvt, uvt });
  const marcada = calcularGMFMensual({ movimientoMensual, cuentaMarcada: true, tarifa, topeExentoUvt, uvt });

  const gmfAnualSinMarcar = sinMarcar.gmfMensual * 12;
  const gmfAnualMarcada = marcada.gmfMensual * 12;

  return {
    topeExento: marcada.topeExento,
    gmfAnualSinMarcar,
    gmfAnualMarcada,
    ahorroAnual: gmfAnualSinMarcar - gmfAnualMarcada
  };
};
