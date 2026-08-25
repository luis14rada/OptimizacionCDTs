import { describe, it, expect } from 'vitest';
import { evaluarObligacionRenta, calcularSancionMinima } from './RentaEngine';
import { CONSTANTES_RENTA_POR_ANIO } from './parametrosRenta';

const { uvt, uvtSancion, ...topesUvt } = CONSTANTES_RENTA_POR_ANIO[2025];

describe('evaluarObligacionRenta', () => {
  it('no está obligado si ningún valor supera su tope', () => {
    const resultado = evaluarObligacionRenta(
      { patrimonioBruto: 50000000, ingresosBrutos: 30000000, consumosTarjeta: 0, comprasConsumos: 0, consignaciones: 0 },
      topesUvt,
      uvt
    );

    expect(resultado.obligado).toBe(false);
    expect(resultado.criteriosSuperados).toHaveLength(0);
  });

  it('queda obligado si supera solo el tope de patrimonio bruto (4.500 UVT)', () => {
    // 4.500 UVT * 49.799 = $224.095.500. Verificado con Node antes de escribir la prueba.
    const resultado = evaluarObligacionRenta(
      { patrimonioBruto: 224095500, ingresosBrutos: 0, consumosTarjeta: 0, comprasConsumos: 0, consignaciones: 0 },
      topesUvt,
      uvt
    );

    expect(resultado.obligado).toBe(true);
    expect(resultado.criteriosSuperados.map(c => c.clave)).toEqual(['patrimonioBruto']);
    expect(resultado.detalle.find(d => d.clave === 'patrimonioBruto').topePesos).toBe(224095500);
  });

  it('queda obligado si supera solo el tope de consignaciones bancarias (1.400 UVT)', () => {
    // 1.400 UVT * 49.799 = $69.718.600.
    const resultado = evaluarObligacionRenta(
      { patrimonioBruto: 0, ingresosBrutos: 0, consumosTarjeta: 0, comprasConsumos: 0, consignaciones: 69718600 },
      topesUvt,
      uvt
    );

    expect(resultado.obligado).toBe(true);
    expect(resultado.criteriosSuperados.map(c => c.clave)).toEqual(['consignaciones']);
  });

  it('basta con superar un tope para quedar obligado, aunque los demás estén en cero', () => {
    const resultado = evaluarObligacionRenta(
      { patrimonioBruto: 0, ingresosBrutos: 69718600, consumosTarjeta: 0, comprasConsumos: 0, consignaciones: 0 },
      topesUvt,
      uvt
    );

    expect(resultado.obligado).toBe(true);
  });

  it('reporta todos los criterios superados cuando se superan varios a la vez', () => {
    const resultado = evaluarObligacionRenta(
      { patrimonioBruto: 300000000, ingresosBrutos: 100000000, consumosTarjeta: 0, comprasConsumos: 0, consignaciones: 0 },
      topesUvt,
      uvt
    );

    expect(resultado.criteriosSuperados.map(c => c.clave)).toEqual(['patrimonioBruto', 'ingresosBrutos']);
  });
});

describe('calcularSancionMinima', () => {
  it('calcula la sanción mínima con la UVT vigente al momento de declarar (10 UVT)', () => {
    // 10 UVT * 52.374 (UVT 2026) = $523.740 -- coincide con la cifra que ya citaba BACKLOG.md.
    expect(calcularSancionMinima(uvtSancion, 10)).toBe(523740);
  });
});
