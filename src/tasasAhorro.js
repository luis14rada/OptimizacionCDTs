/**
 * Tasas efectivas anuales (E.A.) de cuentas de ahorro por entidad.
 *
 * Fuente: Superintendencia Financiera de Colombia, tasas de captación E.A.
 * por entidad para cuentas de ahorro de personas naturales (promedio
 * ponderado de lo efectivamente captado, no la tasa promocional "hasta X%"
 * que anuncia cada banco para un producto puntual).
 *
 * Solo se incluyen entidades con cifra exacta de esta misma fuente y fecha
 * de corte -- evita mezclar metodologías distintas en una misma tabla.
 * Por eso no aparecen bancos como BBVA o Davivienda: de esos solo se
 * encontró la tasa promocional de un producto específico, no el promedio
 * comparable con el resto.
 */
export const FECHA_CORTE_TASAS = '2026-06-17';
export const FUENTE_TASAS = 'Superintendencia Financiera de Colombia';
export const FUENTE_TASAS_URL =
  'https://www.semana.com/economia/management/articulo/pagan-hasta-el-11-de-interes-las-cuentas-de-ahorros-en-colombia-que-mas-hacen-rendir-la-plata-en-junio-del-2026/202659/';

export const TASAS_AHORRO = [
  { entidad: 'Banco Pichincha (Pibank)', tasaEA: 0.11 },
  { entidad: 'Bansen', tasaEA: 0.0992 },
  { entidad: 'Finandina', tasaEA: 0.0931 },
  { entidad: 'Nu Colombia', tasaEA: 0.0875 },
  { entidad: 'Lulo Bank', tasaEA: 0.0783 },
  { entidad: 'Banco Contactar', tasaEA: 0.0697 },
  { entidad: 'Rappipay', tasaEA: 0.0664 },
  { entidad: 'Bancamía', tasaEA: 0.0559 },
  { entidad: 'Banco de Bogotá', tasaEA: 0.0022 },
  { entidad: 'Bancolombia', tasaEA: 0.0007 }
];

/**
 * Variación anual del IPC (inflación) -- DANE, julio de 2026. Boletín
 * técnico del 7 de julio de 2026.
 * https://www.dane.gov.co/files/operaciones/IPC/jun2026/bol-IPC-jun2026.pdf
 */
export const INFLACION_ANUAL_REFERENCIA = 0.0603;
export const FECHA_CORTE_INFLACION = '2026-07-07';
