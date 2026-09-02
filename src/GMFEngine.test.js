import { describe, it, expect } from 'vitest';
import { calcularGMFTransaccion, calcularAhorroPorMarcarCuenta, calcularMaximoTransferible } from './GMFEngine';

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

describe('calcularMaximoTransferible', () => {
  it('sin marcar la cuenta, reserva del saldo lo necesario para el GMF', () => {
    // $100.000 / 1,004 = 99.601,59 -> 99.601. GMF = 99.601 * 0,004 = 398,404.
    const r = calcularMaximoTransferible({ saldoDisponible: 100000, cuentaMarcada: false, ...supuestos });
    expect(r.montoTransferible).toBe(99601);
    expect(r.gmfTransaccion).toBeCloseTo(398.404, 5);
  });

  it('con la cuenta marcada y saldo bajo el tope, se puede transferir todo', () => {
    const r = calcularMaximoTransferible({ saldoDisponible: 10000000, cuentaMarcada: true, ...supuestos });
    expect(r.montoTransferible).toBe(10000000);
    expect(r.gmfTransaccion).toBe(0);
  });

  it('con la cuenta marcada y saldo sobre el tope, solo reserva el GMF del excedente', () => {
    // (20.000.000 + 18.330.900 * 0,004) / 1,004 = 19.993.350,2 -> 19.993.350.
    const r = calcularMaximoTransferible({ saldoDisponible: 20000000, cuentaMarcada: true, ...supuestos });
    expect(r.montoTransferible).toBe(19993350);
    expect(r.gmfTransaccion).toBeCloseTo(6649.8, 5);
    // Marcar la cuenta deja mover más plata con el mismo saldo.
    const sinMarcar = calcularMaximoTransferible({ saldoDisponible: 20000000, cuentaMarcada: false, ...supuestos });
    expect(r.montoTransferible).toBeGreaterThan(sinMarcar.montoTransferible);
  });

  it('con saldo cero o negativo no hay nada que transferir', () => {
    expect(calcularMaximoTransferible({ saldoDisponible: 0, cuentaMarcada: false, ...supuestos }).montoTransferible).toBe(0);
    expect(calcularMaximoTransferible({ saldoDisponible: -5000, cuentaMarcada: false, ...supuestos }).montoTransferible).toBe(0);
  });

  it('el débito total nunca supera el saldo disponible (la invariante del cálculo)', () => {
    const saldos = [1, 999, 100000, 1234567, 18330900, 18330901, 20000000, 987654321];
    for (const saldo of saldos) {
      for (const cuentaMarcada of [false, true]) {
        const r = calcularMaximoTransferible({ saldoDisponible: saldo, cuentaMarcada, ...supuestos });
        expect(r.totalDebitado).toBeLessThanOrEqual(saldo);
        // Y es el máximo: un peso más se pasaría del saldo.
        const unPesoMas = calcularGMFTransaccion({
          montoTransaccion: r.montoTransferible + 1, cuentaMarcada, ...supuestos
        });
        expect(r.montoTransferible + 1 + unPesoMas.gmfTransaccion).toBeGreaterThan(saldo);
      }
    }
  });
});
