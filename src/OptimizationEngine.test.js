import { describe, it, expect } from 'vitest';
import {
  SMMLV_2026,
  TOPE_IBC_SMMLV,
  calcularTasaPeriodica,
  calcularSeguridadSocial,
  calcularInversionMaximaOptima,
  validarCDT,
  recalcularPortafolio,
  sumarMeses
} from './OptimizationEngine';
import { PARAMETROS_POR_DEFECTO } from './parametros';

const cdtBase = (overrides = {}) => ({
  id: Math.random(),
  banco: 'Banco de Prueba',
  valor: 10000000,
  tasaEA: 10,
  frecuenciaPago: 'mensual',
  plazoMeses: 1,
  fechaInicio: '2026-01-15',
  fechaVencimiento: '2026-02-15',
  ...overrides
});

describe('calcularTasaPeriodica', () => {
  it('con un solo periodo al año, la tasa periódica es igual a la tasa E.A.', () => {
    expect(calcularTasaPeriodica(0.10, 1)).toBeCloseTo(0.10, 10);
  });

  it('convierte correctamente una tasa E.A. a tasa mensual (12 periodos)', () => {
    // (1.12)^(1/12) - 1
    const esperado = Math.pow(1.12, 1 / 12) - 1;
    expect(calcularTasaPeriodica(0.12, 12)).toBeCloseTo(esperado, 12);
  });
});

describe('calcularSeguridadSocial', () => {
  it('no cobra seguridad social por debajo de 1 SMMLV', () => {
    const resultado = calcularSeguridadSocial(SMMLV_2026 - 1);
    expect(resultado).toEqual({ ibc: 0, salud: 0, pension: 0, total: 0, excedeTope: false });
  });

  it('activa seguridad social al cruzar el umbral y aplica el piso del IBC', () => {
    // El umbral se mide sobre el ingreso neto (art. 89 Ley 2277 de 2022), así
    // que en bruto equivale a SMMLV / 0,725 = $2.415.041. Un peso por encima
    // ya obliga. El IBC calculado ahí ($700.362) queda por debajo del SMMLV,
    // así que se aplica el piso de 1 SMMLV.
    const brutoQueCruzaElUmbral = SMMLV_2026 / (1 - PARAMETROS_POR_DEFECTO.costosPresuntos) + 1;
    const resultado = calcularSeguridadSocial(brutoQueCruzaElUmbral);
    expect(resultado.excedeTope).toBe(true);
    expect(resultado.ibc).toBeCloseTo(SMMLV_2026, 6);
    expect(resultado.salud).toBeCloseTo(SMMLV_2026 * 0.125, 6);
    expect(resultado.pension).toBeCloseTo(SMMLV_2026 * 0.16, 6);
  });

  it('calcula el IBC real cuando supera el piso de 1 SMMLV', () => {
    // Ingreso alto: 20.000.000 -> IBC calculado = 20.000.000 * 0.725 * 0.40 = 5.800.000 (> SMMLV)
    const resultado = calcularSeguridadSocial(20000000);
    expect(resultado.excedeTope).toBe(true);
    expect(resultado.ibc).toBeCloseTo(5800000, 2);
    expect(resultado.salud).toBeCloseTo(725000, 2);
    expect(resultado.pension).toBeCloseTo(928000, 2);
    expect(resultado.total).toBeCloseTo(1653000, 2);
  });
});

describe('calcularInversionMaximaOptima', () => {
  it('el resultado recomendado no activa seguridad social, pero invertir bastante más sí', () => {
    const tasaEA = 0.115;
    const frecuencia = 'mensual';
    const plazo = 12;

    const maxInversion = calcularInversionMaximaOptima(tasaEA, frecuencia, plazo);
    const tasaPeriodica = calcularTasaPeriodica(tasaEA, 12);

    const interesConMax = maxInversion * tasaPeriodica;
    // Nos alejamos varios pesos del límite para evitar ambigüedad por redondeo de punto flotante
    // justo en el borde; lo que importa es la relación por debajo/por encima del tope.
    const interesConBastanteMas = (maxInversion + 1000) * tasaPeriodica;

    expect(calcularSeguridadSocial(interesConMax).excedeTope).toBe(false);
    expect(calcularSeguridadSocial(interesConBastanteMas).excedeTope).toBe(true);
  });

  it('con pago al vencimiento, usa la tasa acumulada de todo el plazo (no la tasa mensual)', () => {
    const maxVencimiento = calcularInversionMaximaOptima(0.10, 'al_vencimiento', 12);
    const maxMensual = calcularInversionMaximaOptima(0.10, 'mensual', 12);

    // Al vencimiento el interés se recibe todo de una vez, con la tasa E.A. completa,
    // así que el tope de inversión permitido debe ser mucho menor que pagando mensual.
    expect(maxVencimiento).toBeLessThan(maxMensual);
    expect(maxVencimiento).toBeGreaterThan(0);
  });
});

describe('validarCDT', () => {
  const formValido = () => ({
    banco: 'Bancolombia',
    valor: '10000000',
    tasaEA: '11.5',
    plazoMeses: '12',
    frecuenciaPago: 'mensual',
    fechaInicio: '2026-01-15'
  });

  it('no reporta errores para un formulario válido', () => {
    expect(validarCDT(formValido())).toEqual({});
  });

  it('exige el nombre del banco', () => {
    const errores = validarCDT({ ...formValido(), banco: '  ' });
    expect(errores.banco).toBeDefined();
  });

  it('rechaza un valor invertido en cero o negativo', () => {
    expect(validarCDT({ ...formValido(), valor: '0' }).valor).toBeDefined();
    expect(validarCDT({ ...formValido(), valor: '-5000' }).valor).toBeDefined();
  });

  it('rechaza una tasa E.A. mayor al 50%', () => {
    expect(validarCDT({ ...formValido(), tasaEA: '75' }).tasaEA).toBeDefined();
  });

  it('rechaza un plazo más corto que la frecuencia de pago elegida', () => {
    const errores = validarCDT({ ...formValido(), frecuenciaPago: 'anual', plazoMeses: '6' });
    expect(errores.plazoMeses).toBeDefined();
  });

  it('exige una fecha de inicio', () => {
    expect(validarCDT({ ...formValido(), fechaInicio: '' }).fechaInicio).toBeDefined();
  });
});

describe('recalcularPortafolio', () => {
  it('no cobra seguridad social si el ingreso mensual consolidado no supera el tope', () => {
    const cdt = cdtBase({ valor: 1000000, tasaEA: 5 });
    const resultado = recalcularPortafolio([cdt]);

    expect(resultado.totales.segSocialTotal).toBe(0);
    expect(resultado.cdts[0].totalSegSocial).toBe(0);
    expect(resultado.totales.flujoMensual).toHaveLength(1);
    expect(resultado.totales.flujoMensual[0].excedeTope).toBe(false);
  });

  it('consolida y prorratea la seguridad social entre CDTs que pagan el mismo mes', () => {
    const tasaPeriodica = calcularTasaPeriodica(0.12, 12);
    const cdtA = cdtBase({ valor: 10000000, tasaEA: 12, fechaInicio: '2026-03-10' });
    const cdtB = cdtBase({ valor: 20000000, tasaEA: 12, fechaInicio: '2026-03-10' });

    const interesA = 10000000 * tasaPeriodica;
    const interesB = 20000000 * tasaPeriodica;
    const ingresoTotalMes = interesA + interesB;
    const segSocialEsperada = calcularSeguridadSocial(ingresoTotalMes);

    const resultado = recalcularPortafolio([cdtA, cdtB]);

    // Ambos pagan en el mismo mes calendario, así que deben consolidarse en un solo flujo mensual.
    expect(resultado.totales.flujoMensual).toHaveLength(1);
    expect(resultado.totales.flujoMensual[0].ingresoBrutoMes).toBeCloseTo(ingresoTotalMes, 4);

    // El total de seguridad social del portafolio debe coincidir con el cálculo consolidado (no la suma de cada CDT por separado).
    expect(resultado.totales.segSocialTotal).toBeCloseTo(segSocialEsperada.total, 4);

    // Se debe prorratear proporcionalmente al aporte de intereses de cada CDT.
    const [procesadoA, procesadoB] = resultado.cdts;
    expect(procesadoA.totalSegSocial).toBeCloseTo(segSocialEsperada.total * (interesA / ingresoTotalMes), 4);
    expect(procesadoB.totalSegSocial).toBeCloseTo(segSocialEsperada.total * (interesB / ingresoTotalMes), 4);

    // La suma de lo prorrateado no debe perder ni sumar de más respecto al total.
    expect(procesadoA.totalSegSocial + procesadoB.totalSegSocial).toBeCloseTo(resultado.totales.segSocialTotal, 6);
  });

  it('calcula los totales del portafolio como la suma de cada CDT', () => {
    const cdtA = cdtBase({ valor: 5000000, tasaEA: 8, fechaInicio: '2026-01-01' });
    const cdtB = cdtBase({ valor: 3000000, tasaEA: 9, fechaInicio: '2026-05-01' });

    const resultado = recalcularPortafolio([cdtA, cdtB]);

    expect(resultado.totales.inversionTotal).toBe(8000000);
    expect(resultado.totales.interesBrutoTotal).toBeCloseTo(
      resultado.cdts[0].totalInteresBruto + resultado.cdts[1].totalInteresBruto,
      6
    );
    expect(resultado.totales.interesNetoTotal).toBeCloseTo(
      resultado.cdts[0].totalInteresNeto + resultado.cdts[1].totalInteresNeto,
      6
    );
  });

  it('el flujo mensual queda ordenado cronológicamente', () => {
    const cdt = cdtBase({
      frecuenciaPago: 'mensual',
      plazoMeses: 3,
      fechaInicio: '2026-06-01',
      valor: 1000000,
      tasaEA: 5
    });

    const resultado = recalcularPortafolio([cdt]);
    const meses = resultado.totales.flujoMensual.map(f => f.mesKey);
    const mesesOrdenados = [...meses].sort();
    expect(meses).toEqual(mesesOrdenados);
    expect(meses).toHaveLength(3);
  });
});

/* ==========================================================================
   Regresiones — los tres errores de cálculo detectados en la auditoría.
   Cada prueba se escribió ANTES del arreglo y fallaba con el código anterior.
   ========================================================================== */

describe('Regresión · el IBC respeta el techo legal de 25 SMMLV', () => {
  it('no deja que el IBC supere 25 SMMLV por muy alto que sea el ingreso', () => {
    const resultado = calcularSeguridadSocial(300000000);
    const techo = SMMLV_2026 * TOPE_IBC_SMMLV;

    expect(resultado.ibc).toBeLessThanOrEqual(techo);
    expect(resultado.ibc).toBeCloseTo(techo, 2);
  });

  it('cobra sobre el techo, no sobre el ingreso completo', () => {
    const techo = SMMLV_2026 * TOPE_IBC_SMMLV;
    const resultado = calcularSeguridadSocial(300000000);

    expect(resultado.salud).toBeCloseTo(techo * 0.125, 2);
    expect(resultado.pension).toBeCloseTo(techo * 0.16, 2);
    // Antes del arreglo cobraba $24.795.000; lo correcto es ~$12.475.198.
    expect(resultado.total).toBeLessThan(13000000);
  });

  it('sigue respetando el piso de 1 SMMLV apenas se cruza el umbral', () => {
    // Apenas pasado el umbral neto, el IBC calculado es mucho menor al SMMLV,
    // así que manda el piso.
    const brutoQueCruzaElUmbral = SMMLV_2026 / (1 - PARAMETROS_POR_DEFECTO.costosPresuntos) + 1;
    const resultado = calcularSeguridadSocial(brutoQueCruzaElUmbral);
    expect(resultado.ibc).toBeCloseTo(SMMLV_2026, 2);
  });

  it('en el rango intermedio calcula el IBC real, sin piso ni techo', () => {
    // 20.000.000 * 0,725 * 0,40 = 5.800.000 → entre el piso y el techo
    const resultado = calcularSeguridadSocial(20000000);
    expect(resultado.ibc).toBeCloseTo(5800000, 2);
  });
});

describe('Regresión · no se pierden los periodos parciales', () => {
  it('un CDT de 10 meses con pago trimestral paga 4 veces, no 3', () => {
    const resultado = recalcularPortafolio([cdtBase({
      valor: 100000000, tasaEA: 12, frecuenciaPago: 'trimestral',
      plazoMeses: 10, fechaInicio: '2026-01-15'
    })]);

    // Meses 3, 6, 9 completos + el mes 10 residual
    expect(resultado.totales.flujoMensual).toHaveLength(4);
  });

  it('el interés total corresponde al plazo completo contratado', () => {
    const resultado = recalcularPortafolio([cdtBase({
      valor: 100000000, tasaEA: 12, frecuenciaPago: 'trimestral',
      plazoMeses: 10, fechaInicio: '2026-01-15'
    })]);

    // En un CDT que PAGA intereses periódicamente, el interés no se capitaliza:
    // cada pago se calcula sobre el capital original. El total es la suma de los
    // tres trimestres completos más el mes residual.
    const tasaMensual = calcularTasaPeriodica(0.12, 12);
    const interesTrimestre = 100000000 * (Math.pow(1 + tasaMensual, 3) - 1);
    const interesResidual = 100000000 * (Math.pow(1 + tasaMensual, 1) - 1);
    const esperado = interesTrimestre * 3 + interesResidual;

    // Antes del arreglo faltaba el mes residual: $948.880.
    expect(resultado.totales.interesBrutoTotal).toBeCloseTo(esperado, 0);
  });

  it('cuando el plazo sí es múltiplo de la frecuencia, no agrega pagos de más', () => {
    const resultado = recalcularPortafolio([cdtBase({
      valor: 100000000, tasaEA: 12, frecuenciaPago: 'trimestral',
      plazoMeses: 12, fechaInicio: '2026-01-15'
    })]);
    expect(resultado.totales.flujoMensual).toHaveLength(4);
  });
});

describe('Regresión · las fechas no se desbordan a fin de mes', () => {
  it('31 de enero + 1 mes es 28 de febrero, no 3 de marzo', () => {
    const resultado = sumarMeses(new Date('2026-01-31T12:00:00'), 1);
    expect(resultado.getMonth()).toBe(1); // febrero
    expect(resultado.getDate()).toBe(28);
  });

  it('ajusta al 29 de febrero en año bisiesto', () => {
    const resultado = sumarMeses(new Date('2028-01-31T12:00:00'), 1);
    expect(resultado.getMonth()).toBe(1);
    expect(resultado.getDate()).toBe(29);
  });

  it('31 de marzo + 1 mes es 30 de abril', () => {
    const resultado = sumarMeses(new Date('2026-03-31T12:00:00'), 1);
    expect(resultado.getMonth()).toBe(3); // abril
    expect(resultado.getDate()).toBe(30);
  });

  it('no altera las fechas que sí existen en el mes destino', () => {
    const resultado = sumarMeses(new Date('2026-01-15T12:00:00'), 3);
    expect(resultado.getMonth()).toBe(3); // abril
    expect(resultado.getDate()).toBe(15);
  });

  it('un CDT abierto el 31 de enero no corre su vencimiento al mes siguiente', () => {
    const resultado = recalcularPortafolio([cdtBase({
      valor: 10000000, tasaEA: 10, frecuenciaPago: 'mensual',
      plazoMeses: 1, fechaInicio: '2026-01-31'
    })]);
    // El pago debe caer en febrero de 2026, no en marzo.
    expect(resultado.totales.flujoMensual[0].mesKey).toBe('2026-02');
  });
});

describe('Regresión · el umbral de obligación se mide sobre el ingreso NETO', () => {
  // El art. 89 de la Ley 2277 de 2022 obliga a cotizar a quien tenga
  // "ingresos netos mensuales iguales o superiores a un (1) SMMLV" -- netos,
  // es decir después de restar los costos. El motor comparaba el ingreso
  // BRUTO, así que activaba la obligación antes de tiempo y, en consecuencia,
  // calculaba un tope máximo de inversión más bajo del que la ley permite.
  // SMMLV 2026 = $1.750.905; con 27,5% de costos presuntos el umbral real
  // equivale a un bruto de $2.415.041.
  const SMMLV = PARAMETROS_POR_DEFECTO.smmlv;

  it('no obliga a aportar cuando el neto queda bajo 1 SMMLV, aunque el bruto lo supere', () => {
    // Bruto $2.000.000 -> neto $1.450.000, por debajo del SMMLV.
    const r = calcularSeguridadSocial(2000000, PARAMETROS_POR_DEFECTO);
    expect(r.total).toBe(0);
    expect(r.ibc).toBe(0);
  });

  it('sí obliga a aportar cuando el neto alcanza 1 SMMLV', () => {
    // Bruto $2.500.000 -> neto $1.812.500, por encima del SMMLV.
    const r = calcularSeguridadSocial(2500000, PARAMETROS_POR_DEFECTO);
    expect(r.total).toBeGreaterThan(0);
  });

  it('justo en el bruto equivalente al umbral ($2.415.041) ya hay obligación', () => {
    const brutoEquivalente = SMMLV / (1 - PARAMETROS_POR_DEFECTO.costosPresuntos);
    expect(calcularSeguridadSocial(brutoEquivalente + 1, PARAMETROS_POR_DEFECTO).total).toBeGreaterThan(0);
    expect(calcularSeguridadSocial(brutoEquivalente - 1000, PARAMETROS_POR_DEFECTO).total).toBe(0);
  });

  it('quien prefiera el criterio conservador puede medir el umbral sobre el bruto', () => {
    const conservador = { ...PARAMETROS_POR_DEFECTO, umbralSobreIngresoNeto: false };
    expect(calcularSeguridadSocial(2000000, conservador).total).toBeGreaterThan(0);
  });

  it('el tope máximo de inversión es mayor con el umbral neto que con el bruto', () => {
    const conNeto = calcularInversionMaximaOptima(0.11, 'mensual', 12, PARAMETROS_POR_DEFECTO);
    const conBruto = calcularInversionMaximaOptima(0.11, 'mensual', 12, {
      ...PARAMETROS_POR_DEFECTO,
      umbralSobreIngresoNeto: false
    });
    expect(conNeto).toBeGreaterThan(conBruto);
  });
});
