import { describe, it, expect } from 'vitest';
import { calcularGMFTransaccion, calcularAhorroPorMarcarCuenta } from './GMFEngine';

const supuestos = { tarifa: 0.004, topeExentoUvt: 350, uvt: 52374 };

describe('calcularGMFTransaccion', () => {
  it('sin marcar la cuenta, se grava el 100% de la transacción', () => {
    const r = calcularGMFTransaccion({ montoTransaccion: 20000000, cuentaMarcada: false, ...supuestos });
    expect(r.baseGravada).toBe(20000000);
    expect(r.gmfTransaccion).toBeCloseTo(80000, 5);
  });

  it('con la cuenta marcada, solo se grava el excedente sobre 350 UVT ($18.330.900)', () => {
    // 350 * 52.374 = 18.330.900. Verificado con Node antes de escribir la prueba.
    const r = calcularGMFTransaccion({ montoTransaccion: 20000000, cuentaMarcada: true, ...supuestos });
    expect(r.topeExento).toBe(18330900);
    expect(r.baseGravada).toBeCloseTo(1669100, 5);
    expect(r.gmfTransaccion).toBeCloseTo(6676.4, 5);
  });

  it('con la cuenta marcada y una transacción por debajo del tope, no se paga GMF', () => {
    const r = calcularGMFTransaccion({ montoTransaccion: 10000000, cuentaMarcada: true, ...supuestos });
    expect(r.baseGravada).toBe(0);
    expect(r.gmfTransaccion).toBe(0);
  });
});

describe('calcularAhorroPorMarcarCuenta', () => {
  it('calcula el GMF de la transacción con y sin marcar, y el ahorro puntual', () => {
    // $20.000.000 en una transacción. Valores verificados con Node antes de escribir la prueba.
    const r = calcularAhorroPorMarcarCuenta({ montoTransaccion: 20000000, ...supuestos });
    expect(r.gmfTransaccionSinMarcar).toBeCloseTo(80000, 5);
    expect(r.gmfTransaccionMarcada).toBeCloseTo(6676.4, 5);
    expect(r.ahorroTransaccion).toBeCloseTo(73323.6, 5);
  });

  it('también proyecta el escenario anual, como dato secundario si se repite todos los meses', () => {
    const r = calcularAhorroPorMarcarCuenta({ montoTransaccion: 20000000, ...supuestos });
    expect(r.gmfAnualSinMarcar).toBeCloseTo(960000, 5);
    expect(r.gmfAnualMarcada).toBeCloseTo(80116.8, 5);
    expect(r.ahorroAnual).toBeCloseTo(879883.2, 5);
  });

  it('con una transacción por debajo del tope, marcar la cuenta ahorra el 100% del GMF de esa transacción', () => {
    const r = calcularAhorroPorMarcarCuenta({ montoTransaccion: 10000000, ...supuestos });
    expect(r.gmfTransaccionMarcada).toBe(0);
    expect(r.ahorroTransaccion).toBe(r.gmfTransaccionSinMarcar);
  });
});
