import { describe, it, expect } from 'vitest';
import { calcularRetornoReal, calcularComparacion } from './AhorrosEngine';

describe('calcularRetornoReal', () => {
  it('da un retorno real negativo cuando la tasa nominal no alcanza a cubrir la inflación', () => {
    // Bancolombia (0,07% E.A.) vs. inflación de 6,03% (IPC julio 2026, DANE).
    // Verificado a mano y con Node antes de escribir la prueba: -5,6211%.
    expect(calcularRetornoReal(0.0007, 0.0603)).toBeCloseTo(-0.056210506, 8);
  });

  it('da un retorno real positivo cuando la tasa nominal supera la inflación', () => {
    // Pibank (11% E.A.) vs. la misma inflación: +4,6874%.
    expect(calcularRetornoReal(0.11, 0.0603)).toBeCloseTo(0.046873526, 8);
  });

  it('da retorno real cero cuando la tasa nominal iguala exactamente la inflación', () => {
    expect(calcularRetornoReal(0.0603, 0.0603)).toBe(0);
  });
});

describe('calcularComparacion', () => {
  it('calcula rendimientos, diferencia y variación de poder adquisitivo para un caso real', () => {
    // $10.000.000 en Bancolombia (0,07%) vs. la misma plata en Pibank (11%),
    // con inflación de 6,03%. Valores verificados con Node antes de escribir
    // la prueba.
    const resultado = calcularComparacion({
      saldo: 10000000,
      tasaActual: 0.0007,
      tasaAlternativa: 0.11,
      inflacionAnual: 0.0603
    });

    expect(resultado.rendimientoNominalActual).toBe(7000);
    expect(resultado.rendimientoNominalAlternativa).toBe(1100000);
    expect(resultado.diferenciaAnualNominal).toBe(1093000);
    expect(resultado.retornoRealActual).toBeCloseTo(-0.056210506, 8);
    expect(resultado.retornoRealAlternativa).toBeCloseTo(0.046873526, 8);
    // Negativo: con Bancolombia se pierde poder adquisitivo pese a que el
    // saldo nominal creció.
    expect(resultado.variacionPoderAdquisitivoActual).toBeCloseTo(-562105.06, 1);
  });

  it('la variación de poder adquisitivo es positiva cuando la tasa actual ya supera la inflación', () => {
    const resultado = calcularComparacion({
      saldo: 10000000,
      tasaActual: 0.11,
      tasaAlternativa: 0.11,
      inflacionAnual: 0.0603
    });

    expect(resultado.variacionPoderAdquisitivoActual).toBeGreaterThan(0);
  });
});
