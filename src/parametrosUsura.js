/**
 * Tasa de usura y cifras de crédito informal ("gota a gota").
 *
 * A diferencia del resto de constantes legales del proyecto, la tasa de
 * usura y el Interés Bancario Corriente (IBC) que la fija **cambian todos
 * los meses** -- la Superfinanciera los certifica mes a mes, no una vez al
 * año. Por eso `FECHA_CORTE_IBC` es crítica: si pasó más de un mes, vale la
 * pena reconfirmar el valor antes de usarlo para algo importante.
 *
 * Fórmula legal (art. 884 Código de Comercio y art. 305 Código Penal):
 * tasa de usura = 1,5 x IBC. Cobrar por encima de ese tope es el delito de
 * usura (pena de 32 a 90 meses de prisión); si el cobro TRIPLICA el IBC, la
 * pena aumenta de una mitad a las tres cuartas partes (usura agravada).
 */
export const IBC_VIGENTE = 0.1977; // 19,77% E.A., agosto de 2026.
export const FECHA_CORTE_IBC = '2026-08-01';
export const RESOLUCION_IBC = 'Resolución 1139 de 2026 de la Superintendencia Financiera de Colombia';

export const MULTIPLICADOR_USURA = 1.5; // art. 884 Código de Comercio.
export const MULTIPLICADOR_USURA_AGRAVADA = 3; // art. 305 Código Penal, inciso final.

/**
 * Tasa efectiva anual estimada del crédito informal ("gota a gota") para
 * hogares. Estudio de ANIF y Colombia Fintech, citado por La República el
 * 23 de enero de 2025 -- es un estimado de mercado, no una tasa oficial, y
 * es más antiguo que el resto de los datos de este archivo: tratalo como
 * orden de magnitud, no como cifra exacta del mes actual.
 */
export const TASA_GOTA_A_GOTA_EA = 3.822; // 382,2% E.A.
export const FECHA_ESTUDIO_GOTA_A_GOTA = '2025-01-23';
export const FUENTE_GOTA_A_GOTA_URL =
  'https://www.larepublica.co/finanzas/la-tasa-para-endeudamiento-de-los-hogares-colombianos-ascendio-a-382-2-anual-4044106';
