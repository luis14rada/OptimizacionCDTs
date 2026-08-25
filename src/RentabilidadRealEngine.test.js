import { describe, it, expect } from 'vitest';
import { calcularTasaNetaRetencion, calcularCadenaRentabilidad } from './RentabilidadRealEngine';

describe('calcularTasaNetaRetencion', () => {
  it('descuenta la retención sobre la tasa nominal', () => {
    expect(calcularTasaNetaRetencion(0.10, 0.04)).toBeCloseTo(0.096, 10);
  });

  it('sin retención, la tasa neta es igual a la nominal', () => {
    expect(calcularTasaNetaRetencion(0.10, 0)).toBe(0.10);
  });
});

describe('calcularCadenaRentabilidad', () => {
  it('con una tasa nominal alta, la ganancia real es bastante menos de la mitad de la nominal', () => {
    // 10% E.A., retención 4% (declarante), inflación 6,03% (IPC julio 2026,
    // DANE), saldo $10.000.000. Valores verificados con Node antes de
    // escribir la prueba.
    const resultado = calcularCadenaRentabilidad({
      saldo: 10000000,
      tasaNominalEA: 0.10,
      retencion: 0.04,
      inflacionAnual: 0.0603
    });

    expect(resultado.tasaNetaRetencion).toBeCloseTo(0.096, 10);
    expect(resultado.retornoRealNeto).toBeCloseTo(0.033669716, 8);
    expect(resultado.rendimientoNominal).toBe(1000000);
    expect(resultado.rendimientoNetoRetencion).toBe(960000);
    expect(resultado.gananciaRealPesos).toBeCloseTo(336697.16, 1);
    // De la ganancia nominal, solo sobrevive un 33,67% en términos reales.
    expect(resultado.porcentajeDeLoNominal).toBeCloseTo(0.336697, 5);
  });

  it('con una tasa nominal baja, la retención y la inflación pueden dejar un retorno real negativo', () => {
    // 5% E.A., retención 4%, inflación 6,03%, saldo $10.000.000.
    const resultado = calcularCadenaRentabilidad({
      saldo: 10000000,
      tasaNominalEA: 0.05,
      retencion: 0.04,
      inflacionAnual: 0.0603
    });

    expect(resultado.retornoRealNeto).toBeCloseTo(-0.011600490, 8);
    expect(resultado.gananciaRealPesos).toBeCloseTo(-116004.90, 1);
    expect(resultado.porcentajeDeLoNominal).toBeCloseTo(-0.232010, 5);
  });

  it('con tasa nominal 0%, el porcentaje de lo nominal es 0 en vez de dividir por cero', () => {
    const resultado = calcularCadenaRentabilidad({
      saldo: 10000000,
      tasaNominalEA: 0,
      retencion: 0.04,
      inflacionAnual: 0.0603
    });

    expect(resultado.porcentajeDeLoNominal).toBe(0);
    expect(Number.isFinite(resultado.porcentajeDeLoNominal)).toBe(true);
  });
});
