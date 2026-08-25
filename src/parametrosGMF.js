/**
 * Constantes del Gravamen a los Movimientos Financieros (GMF, "4x1000").
 *
 * La tarifa es permanente desde la Ley 1819 de 2016: esa reforma derogó el
 * cronograma de desmonte gradual que había fijado la Ley 1739 de 2014 (que
 * preveía bajar a 0% en 2022) y dejó el 4x1000 sin fecha de vencimiento.
 * Ojo: varias páginas oficiales y de terceros todavía reproducen ese
 * cronograma viejo -- se verificó cruzando varias fuentes independientes
 * (incluida una nota de prensa fechada en junio de 2026) que la tarifa
 * vigente sigue siendo 4x1000.
 *
 * La exención de 350 UVT mensuales para una cuenta marcada (art. 879 numeral
 * 1 ET) sigue exigiendo el trámite manual con el banco en 2026: la Ley 2277
 * de 2022 (art. 881-1 ET) ordenó automatizar la exención entre todas las
 * cuentas de una persona, incluso en distintos bancos, desde el 13 de
 * diciembre de 2024 -- pero esa automatización todavía no está plenamente
 * implementada (no hay una plataforma centralizada operando), así que en la
 * práctica sigue siendo necesario pedirle al banco que marque una cuenta
 * como exenta.
 */
export const TARIFA_GMF = 0.004; // 4x1000, art. 872 ET.
export const TOPE_EXENTO_MENSUAL_UVT = 350; // art. 879 numeral 1 ET.
export const UVT_GMF = 52374; // UVT 2026, Resolución DIAN 000238 de 2025.

export const FUENTE_GMF =
  'Art. 872 ET (tarifa, modificado por el art. 45 de la Ley 1739 de 2014 y mantenido de forma permanente por la ' +
  'Ley 1819 de 2016); art. 879 numeral 1 ET y art. 881-1 ET, adicionado por la Ley 2277 de 2022 (exención de 350 UVT ' +
  'mensuales en una cuenta marcada). UVT: Resolución DIAN 000238 de 2025.';
