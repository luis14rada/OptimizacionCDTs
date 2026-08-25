/**
 * Motor de la cobertura de Fogafín repartida entre varias entidades. La
 * cobertura es por depositante y por entidad: todo lo que tengas en el
 * mismo banco (CDTs, ahorros, corriente) se suma para un solo tope; bancos
 * distintos tienen cada uno su propio tope, independiente entre sí.
 */

/**
 * Agrupa los montos por entidad y calcula cuánto queda cubierto y cuánto
 * descubierto en cada una contra el tope de cobertura.
 */
export const evaluarCoberturaPorEntidad = (posiciones, coberturaMaxima) => {
  const totalesPorEntidad = new Map();
  posiciones.forEach(({ entidad, monto }) => {
    totalesPorEntidad.set(entidad, (totalesPorEntidad.get(entidad) || 0) + (monto || 0));
  });

  const porEntidad = Array.from(totalesPorEntidad, ([entidad, monto]) => ({
    entidad,
    monto,
    cubierto: Math.min(monto, coberturaMaxima),
    descubierto: Math.max(0, monto - coberturaMaxima)
  }));

  const totalDescubierto = porEntidad.reduce((suma, e) => suma + e.descubierto, 0);
  const totalInvertido = porEntidad.reduce((suma, e) => suma + e.monto, 0);

  return { porEntidad, totalDescubierto, totalInvertido };
};

/** Cuántas entidades como mínimo hacen falta para que un monto total quede completamente cubierto. */
export const entidadesNecesariasParaCobertura = (montoTotal, coberturaMaxima) => {
  if (montoTotal <= 0 || coberturaMaxima <= 0) return 0;
  return Math.ceil(montoTotal / coberturaMaxima);
};
