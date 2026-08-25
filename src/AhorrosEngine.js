/**
 * Cálculo del costo de tener plata en una cuenta de ahorros de baja tasa,
 * en vez de una de mayor rendimiento. Sin dependencias de React, igual que
 * OptimizationEngine.js, para que sea fácil de probar y auditar aparte.
 */

/**
 * Retorno real de una tasa nominal, descontando inflación (ecuación de
 * Fisher). Da negativo cuando la tasa nominal no alcanza a cubrir la
 * inflación: el saldo crece en pesos, pero pierde poder adquisitivo.
 */
export const calcularRetornoReal = (tasaEA, inflacionAnual) => {
  return (1 + tasaEA) / (1 + inflacionAnual) - 1;
};

/**
 * Compara el saldo en la entidad actual contra una alternativa: cuánto
 * rinde cada una en pesos al año, la diferencia entre ambas, y cuánto poder
 * adquisitivo se gana o se pierde con la tasa actual.
 */
export const calcularComparacion = ({ saldo, tasaActual, tasaAlternativa, inflacionAnual }) => {
  const rendimientoNominalActual = saldo * tasaActual;
  const rendimientoNominalAlternativa = saldo * tasaAlternativa;
  const retornoRealActual = calcularRetornoReal(tasaActual, inflacionAnual);
  const retornoRealAlternativa = calcularRetornoReal(tasaAlternativa, inflacionAnual);

  return {
    rendimientoNominalActual,
    rendimientoNominalAlternativa,
    diferenciaAnualNominal: rendimientoNominalAlternativa - rendimientoNominalActual,
    retornoRealActual,
    retornoRealAlternativa,
    // Negativo: se pierde poder adquisitivo con la tasa actual, aunque el
    // saldo nominal haya crecido. Positivo: se gana.
    variacionPoderAdquisitivoActual: saldo * retornoRealActual
  };
};
