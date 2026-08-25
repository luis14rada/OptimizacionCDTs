/**
 * Fondo de emergencia: no hay una norma colombiana que fije cuánto hay que
 * ahorrar -- es una práctica de planeación financiera personal, ampliamente
 * usada por asesores financieros (típicamente entre 3 y 6 meses de gastos
 * fijos). Los valores por defecto reflejan ese estándar, no una ley.
 */
export const MESES_MINIMO_RECOMENDADO = 3;
export const MESES_MAXIMO_RECOMENDADO = 6;

/**
 * Solo 1 de cada 5 colombianos podría asumir un gasto imprevisto
 * importante, según Banco W (julio de 2026).
 */
export const FUENTE_ESTADISTICA = 'Banco W';
export const FECHA_ESTADISTICA = '2026-07-15';
export const PROPORCION_PUEDE_CUBRIR_IMPREVISTO = 0.2; // 1 de cada 5.
