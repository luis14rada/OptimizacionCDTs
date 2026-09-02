/**
 * Motor del Gravamen a los Movimientos Financieros (GMF, "4x1000").
 *
 * Modelo por transacción, no por promedio mensual: no se puede asegurar que
 * una persona vaya a repetir el mismo movimiento todos los meses, así que el
 * cálculo principal es el costo de UNA transacción puntual. La proyección
 * mensual/anual es secundaria y solo aplica si la persona confirma que va a
 * repetir ese mismo movimiento de forma recurrente.
 *
 * Para una cuenta marcada como exenta, el cálculo asume que la transacción
 * ingresada es el único movimiento del mes en esa cuenta -- si ya hubo otros
 * retiros antes en el mismo mes, el resultado real puede variar, porque la
 * exención de 350 UVT se acumula mes a mes (art. 879 numeral 1 ET), no
 * transacción por transacción.
 */

/** GMF de una transacción puntual, con o sin la cuenta marcada como exenta. */
export const calcularGMFTransaccion = ({ montoTransaccion, cuentaMarcada, tarifa, topeExentoUvt, uvt }) => {
  const topeExento = topeExentoUvt * uvt;
  const baseGravada = cuentaMarcada ? Math.max(0, montoTransaccion - topeExento) : montoTransaccion;
  return {
    topeExento,
    baseGravada,
    gmfTransaccion: baseGravada * tarifa
  };
};

/**
 * Compara el GMF de una transacción con y sin la cuenta marcada, con el
 * ahorro puntual. Incluye además la proyección mensual/anual *si* ese mismo
 * movimiento se repitiera todos los meses -- un escenario secundario, no el
 * resultado principal.
 */
export const calcularAhorroPorMarcarCuenta = ({ montoTransaccion, tarifa, topeExentoUvt, uvt }) => {
  const sinMarcar = calcularGMFTransaccion({ montoTransaccion, cuentaMarcada: false, tarifa, topeExentoUvt, uvt });
  const marcada = calcularGMFTransaccion({ montoTransaccion, cuentaMarcada: true, tarifa, topeExentoUvt, uvt });

  const ahorroTransaccion = sinMarcar.gmfTransaccion - marcada.gmfTransaccion;
  const gmfAnualSinMarcar = sinMarcar.gmfTransaccion * 12;
  const gmfAnualMarcada = marcada.gmfTransaccion * 12;

  return {
    topeExento: marcada.topeExento,
    gmfTransaccionSinMarcar: sinMarcar.gmfTransaccion,
    gmfTransaccionMarcada: marcada.gmfTransaccion,
    ahorroTransaccion,
    gmfAnualSinMarcar,
    gmfAnualMarcada,
    ahorroAnual: gmfAnualSinMarcar - gmfAnualMarcada
  };
};

/**
 * Problema inverso: la persona ya tiene un saldo y quiere sacarlo completo.
 *
 * El banco no descuenta el GMF de adentro del monto: lo debita ADEMÁS del
 * monto, así que el saldo tiene que alcanzar para los dos. Transferir el
 * saldo entero es imposible cuando hay GMF -- siempre queda un pedazo que
 * debe reservarse para el impuesto.
 *
 * Despejando `monto + max(0, monto - exento) * tarifa <= saldo` sale
 * `(saldo + exento * tarifa) / (1 + tarifa)`. El `min` contra el saldo cubre
 * el caso de la cuenta marcada cuya transacción entera cabe bajo el tope
 * exento: ahí no hay GMF y se puede mover todo.
 */
export const calcularMaximoTransferible = ({ saldoDisponible, cuentaMarcada, tarifa, topeExentoUvt, uvt }) => {
  const saldo = Math.max(0, saldoDisponible);
  const exento = cuentaMarcada ? topeExentoUvt * uvt : 0;

  const exacto = Math.min(saldo, (saldo + exento * tarifa) / (1 + tarifa));
  // Se redondea hacia abajo al peso: hacia arriba dejaría el débito por encima
  // del saldo, que es justamente lo que se quiere evitar.
  const montoTransferible = Math.floor(exacto);

  const { gmfTransaccion } = calcularGMFTransaccion({
    montoTransaccion: montoTransferible, cuentaMarcada, tarifa, topeExentoUvt, uvt
  });

  return {
    montoTransferible,
    gmfTransaccion,
    totalDebitado: montoTransferible + gmfTransaccion
  };
};
