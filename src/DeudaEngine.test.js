import { describe, it, expect } from 'vitest';
import { mensualAEA, clasificarTasa, calcularCostoDeuda } from './DeudaEngine';

const IBC = 0.1977; // agosto de 2026.
const MULT_USURA = 1.5;
const MULT_AGRAVADA = 3;

describe('mensualAEA', () => {
  it('convierte una tasa mensual del 20% a su equivalente efectiva anual', () => {
    // (1.20)^12 - 1 = 791,61%. Verificado con Node antes de escribir la prueba.
    expect(mensualAEA(0.20)).toBeCloseTo(7.916100448, 8);
  });

  it('con tasa mensual 0%, la EA también es 0%', () => {
    expect(mensualAEA(0)).toBe(0);
  });
});

describe('clasificarTasa', () => {
  it('clasifica como legal una tasa por debajo de la tasa de usura (1,5x IBC)', () => {
    expect(clasificarTasa(0.25, IBC, MULT_USURA, MULT_AGRAVADA)).toBe('legal');
  });

  it('clasifica como usura una tasa por encima del tope pero sin triplicar el IBC', () => {
    // Tope: 1.5 * 0.1977 = 29,655%.
    expect(clasificarTasa(0.40, IBC, MULT_USURA, MULT_AGRAVADA)).toBe('usura');
  });

  it('clasifica como usura agravada una tasa que triplica el IBC', () => {
    // Umbral agravado: 3 * 0.1977 = 59,31%.
    expect(clasificarTasa(0.65, IBC, MULT_USURA, MULT_AGRAVADA)).toBe('usura_agravada');
  });
});

describe('calcularCostoDeuda', () => {
  it('con una tasa dentro del tope legal, no hay sobrecosto', () => {
    const r = calcularCostoDeuda({ montoDeuda: 5000000, tasaEA: 0.25, ibc: IBC, multiplicadorUsura: MULT_USURA, multiplicadorAgravada: MULT_AGRAVADA });

    expect(r.clasificacion).toBe('legal');
    expect(r.sobrecostoAnual).toBe(0);
  });

  it('con una tasa de usura, calcula el sobrecosto anual frente al tope legal', () => {
    // $5.000.000 al 40% E.A. Valores verificados con Node antes de escribir la prueba.
    const r = calcularCostoDeuda({ montoDeuda: 5000000, tasaEA: 0.40, ibc: IBC, multiplicadorUsura: MULT_USURA, multiplicadorAgravada: MULT_AGRAVADA });

    expect(r.tasaUsura).toBeCloseTo(0.29655, 10);
    expect(r.interesAnualPropio).toBe(2000000);
    expect(r.interesAnualAlTopeLegal).toBeCloseTo(1482750, 5);
    expect(r.sobrecostoAnual).toBeCloseTo(517250, 5);
    expect(r.clasificacion).toBe('usura');
  });

  it('con usura agravada, también calcula el sobrecosto y clasifica correctamente', () => {
    const r = calcularCostoDeuda({ montoDeuda: 5000000, tasaEA: 0.65, ibc: IBC, multiplicadorUsura: MULT_USURA, multiplicadorAgravada: MULT_AGRAVADA });

    expect(r.clasificacion).toBe('usura_agravada');
    expect(r.sobrecostoAnual).toBeCloseTo(1767250, 5);
  });
});
