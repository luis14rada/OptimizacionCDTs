import { describe, it, expect } from 'vitest';
import { calcularFondoEmergencia } from './FondoEmergenciaEngine';

describe('calcularFondoEmergencia', () => {
  it('calcula el monto objetivo, el faltante y el porcentaje avanzado', () => {
    // Gastos $2.000.000/mes, meta de 6 meses, ya ahorrado $3.000.000.
    const r = calcularFondoEmergencia({ gastosMensuales: 2000000, mesesObjetivo: 6, ahorroActual: 3000000 });

    expect(r.montoObjetivo).toBe(12000000);
    expect(r.faltante).toBe(9000000);
    expect(r.porcentajeCompletado).toBeCloseTo(25, 5);
    expect(r.mesesCubiertosHoy).toBeCloseTo(1.5, 5);
  });

  it('cuando el ahorro ya supera la meta, el faltante es 0 y el porcentaje se limita a 100', () => {
    const r = calcularFondoEmergencia({ gastosMensuales: 1000000, mesesObjetivo: 3, ahorroActual: 5000000 });

    expect(r.faltante).toBe(0);
    expect(r.porcentajeCompletado).toBe(100);
    expect(r.mesesCubiertosHoy).toBe(5);
  });

  it('sin ahorro previo, el faltante es igual al monto objetivo completo', () => {
    const r = calcularFondoEmergencia({ gastosMensuales: 1500000, mesesObjetivo: 6, ahorroActual: 0 });

    expect(r.faltante).toBe(r.montoObjetivo);
    expect(r.porcentajeCompletado).toBe(0);
  });
});
