/**
 * Motor del costo de tener una cuenta bancaria: lo que cobra cada mes por
 * cuota de manejo (cuenta + tarjeta débito) multiplicado por doce.
 */

/** Costo anual de una cuota mensual fija. */
export const calcularCostoAnualCuenta = (cuotaMensual) => cuotaMensual * 12;

/**
 * Suma la cuota de cuenta y de tarjeta débito de una entidad. Si alguna de
 * las dos no se conoce (`null` en la tabla de referencia), el total también
 * queda `null` en vez de tratarse como 0 -- evita subestimar el costo real
 * de una entidad de la que solo se conoce una parte del dato.
 */
export const totalMensualEntidad = ({ cuotaCuenta, cuotaTarjeta }) => {
  if (cuotaCuenta == null || cuotaTarjeta == null) return null;
  return cuotaCuenta + cuotaTarjeta;
};
