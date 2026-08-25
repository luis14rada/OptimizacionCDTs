/**
 * Motor del fondo de emergencia: cuánto hace falta ahorrar según los gastos
 * mensuales fijos y cuántos meses de cobertura se quieran, y qué tan cerca
 * está el ahorro actual de esa meta.
 */
export const calcularFondoEmergencia = ({ gastosMensuales, mesesObjetivo, ahorroActual }) => {
  const montoObjetivo = gastosMensuales * mesesObjetivo;
  const faltante = Math.max(0, montoObjetivo - ahorroActual);
  const porcentajeCompletado = montoObjetivo > 0
    ? Math.min(100, (ahorroActual / montoObjetivo) * 100)
    : 0;
  const mesesCubiertosHoy = gastosMensuales > 0 ? ahorroActual / gastosMensuales : 0;

  return { montoObjetivo, faltante, porcentajeCompletado, mesesCubiertosHoy };
};
