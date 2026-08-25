import { describe, it, expect } from 'vitest';
import { calcularGMFMensual, calcularAhorroPorMarcarCuenta } from './GMFEngine';

const supuestos = { tarifa: 0.004, topeExentoUvt: 350, uvt: 52374 };

describe('calcularGMFMensual', () => {
  it('sin marcar la cuenta, se grava todo el movimiento del mes', () => {
    const r = calcularGMFMensual({ movimientoMensual: 20000000, cuentaMarcada: false, ...supuestos });
    expect(r.baseGravada).toBe(20000000);
    expect(r.gmfMensual).toBeCloseTo(80000, 5);
  });

  it('con la cuenta marcada, solo se grava el excedente sobre 350 UVT ($18.330.900)', () => {
    // 350 * 52.374 = 18.330.900. Verificado con Node antes de escribir la prueba.
    const r = calcularGMFMensual({ movimientoMensual: 20000000, cuentaMarcada: true, ...supuestos });
    expect(r.topeExento).toBe(18330900);
    expect(r.baseGravada).toBeCloseTo(1669100, 5);
    expect(r.gmfMensual).toBeCloseTo(6676.4, 5);
  });

  it('con la cuenta marcada y movimientos por debajo del tope, no se paga GMF', () => {
    const r = calcularGMFMensual({ movimientoMensual: 10000000, cuentaMarcada: true, ...supuestos });
    expect(r.baseGravada).toBe(0);
    expect(r.gmfMensual).toBe(0);
  });
});

describe('calcularAhorroPorMarcarCuenta', () => {
  it('calcula el ahorro anual de marcar la cuenta cuando los movimientos superan el tope', () => {
    // $20.000.000/mes. Valores verificados con Node antes de escribir la prueba.
    const r = calcularAhorroPorMarcarCuenta({ movimientoMensual: 20000000, ...supuestos });
    expect(r.gmfAnualSinMarcar).toBeCloseTo(960000, 5);
    expect(r.gmfAnualMarcada).toBeCloseTo(80116.8, 5);
    expect(r.ahorroAnual).toBeCloseTo(879883.2, 5);
  });

  it('con movimientos por debajo del tope, marcar la cuenta ahorra el 100% del GMF', () => {
    const r = calcularAhorroPorMarcarCuenta({ movimientoMensual: 10000000, ...supuestos });
    expect(r.gmfAnualMarcada).toBe(0);
    expect(r.ahorroAnual).toBe(r.gmfAnualSinMarcar);
  });
});
