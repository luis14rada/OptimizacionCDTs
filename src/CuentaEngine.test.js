import { describe, it, expect } from 'vitest';
import { calcularCostoAnualCuenta, totalMensualEntidad } from './CuentaEngine';

describe('calcularCostoAnualCuenta', () => {
  it('multiplica la cuota mensual por doce', () => {
    expect(calcularCostoAnualCuenta(13500)).toBe(162000);
  });

  it('con cuota 0, el costo anual es 0', () => {
    expect(calcularCostoAnualCuenta(0)).toBe(0);
  });
});

describe('totalMensualEntidad', () => {
  it('suma cuota de cuenta y de tarjeta cuando ambas se conocen', () => {
    // Banco AV Villas: $44.030 + $24.150 = $68.180.
    expect(totalMensualEntidad({ cuotaCuenta: 44030, cuotaTarjeta: 24150 })).toBe(68180);
  });

  it('devuelve null si falta el dato de cuenta', () => {
    expect(totalMensualEntidad({ cuotaCuenta: null, cuotaTarjeta: 17900 })).toBeNull();
  });

  it('devuelve null si falta el dato de tarjeta', () => {
    expect(totalMensualEntidad({ cuotaCuenta: 20825, cuotaTarjeta: null })).toBeNull();
  });
});
