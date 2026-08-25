/**
 * Cuotas de manejo de cuentas y tarjetas débito en Colombia.
 *
 * Fuente: actualización trimestral de productos de depósito de la
 * Superintendencia Financiera de Colombia, corte 1 de julio de 2026,
 * reproducida por La República. A diferencia de `tasasAhorro.js`, esta NO es
 * una tabla completa de todas las entidades del mercado -- el reporte cubre
 * 25 bancos, pero las notas de prensa disponibles solo desglosaron las
 * cuotas más altas de cada categoría (9 entidades con cobro en cuenta, 7 con
 * cobro en tarjeta débito), no la lista completa de las que cobran $0. Por
 * eso esta tabla es una referencia de "cuánto puede llegar a costar", no un
 * comparador exhaustivo -- si tu entidad no aparece, puede que no cobre
 * nada, pero confirmalo con tu propio extracto o tarifario.
 */
export const FECHA_CORTE_CUOTAS = '2026-07-01';
export const FUENTE_CUOTAS = 'Superintendencia Financiera de Colombia';
export const FUENTE_CUOTAS_URL = 'https://www.larepublica.co/finanzas/cuotas-de-manejo-en-cuentas-de-ahorro-4445937';

/**
 * `cuotaCuenta` y `cuotaTarjeta` en pesos/mes; `null` cuando el reporte no
 * desglosó ese dato para la entidad (no significa necesariamente $0).
 */
export const CUOTAS_MANEJO = [
  { entidad: 'Banco AV Villas', cuotaCuenta: 44030, cuotaTarjeta: 24150 },
  { entidad: 'Banco Popular', cuotaCuenta: 20825, cuotaTarjeta: null },
  { entidad: 'Itaú', cuotaCuenta: 20278, cuotaTarjeta: null },
  { entidad: 'Davivienda', cuotaCuenta: 13500, cuotaTarjeta: null },
  { entidad: 'Bancamía', cuotaCuenta: 10200, cuotaTarjeta: 10200 },
  { entidad: 'Banco de Bogotá', cuotaCuenta: null, cuotaTarjeta: 17900 },
  { entidad: 'Banco de Occidente', cuotaCuenta: null, cuotaTarjeta: 16700 },
  { entidad: 'Banco Mundo Mujer', cuotaCuenta: null, cuotaTarjeta: 10330 },
  { entidad: 'Ban100', cuotaCuenta: null, cuotaTarjeta: 10000 }
];

/**
 * Entidades ampliamente conocidas por no cobrar cuota de manejo (verificado
 * cruzando varias fuentes de 2026) -- se listan por nombre para dar puntos
 * de comparación reales, aunque no formen parte del desglose numérico de
 * arriba.
 */
export const ENTIDADES_SIN_CUOTA_CONOCIDAS = [
  'Nu Colombia', 'Lulo Bank', 'Banco Falabella', 'Banco Caja Social', 'Scotiabank Colpatria', 'Ualá'
];
