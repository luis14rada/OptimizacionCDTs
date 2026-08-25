/**
 * Constantes legales de la obligación de declarar renta como persona
 * natural, por año gravable. Mismo patrón que `CONSTANTES_POR_ANIO` en
 * `src/parametros.js`: todo lo que la ley cambia cada año vive en una
 * tabla, no incrustado en el motor -- así, si la DIAN ajusta un tope o
 * la UVT, se edita una entrada en vez de tocar `RentaEngine.js`.
 *
 * Los 5 topes salen del artículo 592 del Estatuto Tributario, reglamentado
 * por el artículo 1.6.1.13.2.7 del Decreto 1625 de 2016. Se evalúan con la
 * UVT del año gravable (el año que se declara), mientras que la sanción
 * mínima (artículo 639 ET, 10 UVT) se calcula con la UVT vigente al momento
 * de declarar -- que es la del año siguiente, cuando ya se presentó tarde.
 *
 * Verificado contra la Resolución DIAN 000193 de 2024 (UVT 2025) y la
 * Resolución DIAN 000238 de 2025 (UVT 2026), el 25 de agosto de 2026.
 */
export const CONSTANTES_RENTA_POR_ANIO = {
  2025: {
    // Año gravable 2025, declaración en 2026.
    uvt: 49799,
    uvtSancion: 52374, // UVT 2026: año en que se presenta/paga la declaración.
    topePatrimonioBrutoUvt: 4500,
    topeIngresosBrutosUvt: 1400,
    topeConsumosTarjetaUvt: 1400,
    topeComprasConsumosUvt: 1400,
    topeConsignacionesUvt: 1400,
    sancionMinimaUvt: 10
  }
};

export const ANIO_GRAVABLE_RENTA_POR_DEFECTO = 2025;

export const FUENTE_RENTA =
  'Art. 592-593 del Estatuto Tributario, reglamentado por el art. 1.6.1.13.2.7 del Decreto 1625 de 2016 (topes); ' +
  'art. 639 ET (sanción mínima). UVT: Resolución DIAN 000193 de 2024 (2025) y 000238 de 2025 (2026).';

export const parametrosRentaPorDefecto = (anioGravable = ANIO_GRAVABLE_RENTA_POR_DEFECTO) => {
  const base = CONSTANTES_RENTA_POR_ANIO[anioGravable] || CONSTANTES_RENTA_POR_ANIO[ANIO_GRAVABLE_RENTA_POR_DEFECTO];
  return { anioGravable, ...base };
};
