/**
 * Motor del costo real de una deuda: clasifica la tasa que te cobran contra
 * la tasa de usura (art. 884 C. Co. y art. 305 C.P.) y calcula cuánto pagás
 * de más frente al tope legal.
 */

/** Convierte una tasa mensual (la que suele anunciar el crédito informal) a efectiva anual. */
export const mensualAEA = (tasaMensual) => Math.pow(1 + tasaMensual, 12) - 1;

/**
 * Clasifica una tasa efectiva anual contra los umbrales legales.
 * 'legal': por debajo de la tasa de usura.
 * 'usura': por encima de la tasa de usura -- delito (art. 305 C.P.).
 * 'usura_agravada': triplica el IBC -- delito con pena aumentada.
 */
export const clasificarTasa = (tasaEA, ibc, multiplicadorUsura, multiplicadorAgravada) => {
  if (tasaEA > ibc * multiplicadorAgravada) return 'usura_agravada';
  if (tasaEA > ibc * multiplicadorUsura) return 'usura';
  return 'legal';
};

/** Calcula el interés anual que se paga, el que se pagaría al tope legal, y el sobrecosto. */
export const calcularCostoDeuda = ({ montoDeuda, tasaEA, ibc, multiplicadorUsura, multiplicadorAgravada }) => {
  const tasaUsura = ibc * multiplicadorUsura;
  const tasaUsuraAgravada = ibc * multiplicadorAgravada;

  const interesAnualPropio = montoDeuda * tasaEA;
  const interesAnualAlTopeLegal = montoDeuda * tasaUsura;
  const sobrecostoAnual = Math.max(0, interesAnualPropio - interesAnualAlTopeLegal);

  return {
    tasaUsura,
    tasaUsuraAgravada,
    interesAnualPropio,
    interesAnualAlTopeLegal,
    sobrecostoAnual,
    clasificacion: clasificarTasa(tasaEA, ibc, multiplicadorUsura, multiplicadorAgravada)
  };
};
