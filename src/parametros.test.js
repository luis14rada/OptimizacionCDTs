import { describe, it, expect } from 'vitest';
import {
  calcularSeguridadSocial,
  recalcularPortafolio,
  calcularInversionMaximaOptima
} from './OptimizationEngine';
import {
  parametrosPorDefecto,
  PARAMETROS_POR_DEFECTO,
  CONSTANTES_POR_ANIO,
  SITUACIONES_LABORALES
} from './parametros';

const cdt = (overrides = {}) => ({
  id: 1,
  banco: 'Banco de Prueba',
  valor: 100000000,
  tasaEA: 12,
  frecuenciaPago: 'mensual',
  plazoMeses: 1,
  fechaInicio: '2026-03-10',
  fechaVencimiento: '2026-04-10',
  ...overrides
});

describe('parametrosPorDefecto', () => {
  it('2026 viene sin componente inflacionario, porque el decreto no existe todavía', () => {
    const p = parametrosPorDefecto(2026);
    expect(p.componenteInflacionarioActivo).toBe(false);
    expect(CONSTANTES_POR_ANIO[2026].componenteInflacionario).toBeNull();
  });

  it('2025 precarga el 55,43% del Decreto 898 de 2026, pero sigue desactivado', () => {
    const p = parametrosPorDefecto(2025);
    expect(p.componenteInflacionario).toBeCloseTo(0.5543, 4);
    expect(p.componenteInflacionarioActivo).toBe(false);
    expect(p.smmlv).toBe(1423500);
  });

  it('la retención por defecto es 4% y la situación por defecto es empleado', () => {
    // Empleado es la situación más común de quien abre un CDT; arrancar en
    // "rentista de capital" le mostraba a la mayoría un cálculo que no era el suyo.
    expect(PARAMETROS_POR_DEFECTO.retencion).toBeCloseTo(0.04, 6);
    expect(PARAMETROS_POR_DEFECTO.situacionLaboral).toBe('empleado');
  });
});

describe('Retención configurable', () => {
  it('con 7% retiene casi el doble que con 4%', () => {
    const con4 = recalcularPortafolio([cdt()], { retencion: 0.04 });
    const con7 = recalcularPortafolio([cdt()], { retencion: 0.07 });

    expect(con7.totales.retencionTotal / con4.totales.retencionTotal).toBeCloseTo(1.75, 5);
  });

  it('una retención mayor reduce el interés neto', () => {
    const con4 = recalcularPortafolio([cdt()], { retencion: 0.04 });
    const con7 = recalcularPortafolio([cdt()], { retencion: 0.07 });
    expect(con7.totales.interesNetoTotal).toBeLessThan(con4.totales.interesNetoTotal);
  });
});

describe('Componente inflacionario', () => {
  it('desactivado, la retención se calcula sobre el rendimiento completo', () => {
    const r = recalcularPortafolio([cdt()], { componenteInflacionarioActivo: false });
    expect(r.totales.baseNoGravadaTotal).toBe(0);
    expect(r.totales.retencionTotal).toBeCloseTo(r.totales.interesBrutoTotal * 0.04, 4);
  });

  it('activado al 55,43%, la retención cae proporcionalmente', () => {
    const r = recalcularPortafolio([cdt()], {
      componenteInflacionarioActivo: true,
      componenteInflacionario: 0.5543
    });

    const gravado = r.totales.interesBrutoTotal * (1 - 0.5543);
    expect(r.totales.retencionTotal).toBeCloseTo(gravado * 0.04, 4);
    expect(r.totales.baseNoGravadaTotal).toBeCloseTo(r.totales.interesBrutoTotal * 0.5543, 4);
  });

  it('no altera el interés bruto ni la seguridad social, solo la base gravada', () => {
    const sin = recalcularPortafolio([cdt()], { componenteInflacionarioActivo: false });
    const con = recalcularPortafolio([cdt()], {
      componenteInflacionarioActivo: true, componenteInflacionario: 0.5543
    });

    expect(con.totales.interesBrutoTotal).toBeCloseTo(sin.totales.interesBrutoTotal, 6);
    expect(con.totales.segSocialTotal).toBeCloseTo(sin.totales.segSocialTotal, 6);
  });
});

describe('Situación laboral', () => {
  const ingresoAlto = 20000000;

  it('el rentista aporta salud y pensión', () => {
    const r = calcularSeguridadSocial(ingresoAlto, { situacionLaboral: 'rentista' });
    expect(r.salud).toBeGreaterThan(0);
    expect(r.pension).toBeGreaterThan(0);
  });

  it('el pensionado aporta salud pero NO pensión', () => {
    const r = calcularSeguridadSocial(ingresoAlto, { situacionLaboral: 'pensionado' });
    expect(r.salud).toBeGreaterThan(0);
    expect(r.pension).toBe(0);
    expect(r.total).toBeCloseTo(r.salud, 6);
  });

  it('el umbral de 1 SMMLV también protege a quien ya cotiza por un salario', () => {
    // El art. 89 de la Ley 2277 de 2022 hace nacer la obligación con ingresos
    // netos de 1 SMMLV, sin condicionarla a tener vínculo laboral. Antes el
    // empleado aportaba desde el primer peso.
    const ingresoPequeno = 500000; // muy por debajo de 1 SMMLV

    const rentista = calcularSeguridadSocial(ingresoPequeno, { situacionLaboral: 'rentista' });
    const empleado = calcularSeguridadSocial(ingresoPequeno, { situacionLaboral: 'empleado', ibcYaCotizado: 3000000 });

    expect(rentista.total).toBe(0);
    expect(empleado.total).toBe(0);
  });

  it('el criterio conservador se puede recuperar: sin umbral, el empleado aporta desde el primer peso', () => {
    const empleado = calcularSeguridadSocial(500000, {
      situacionLaboral: 'empleado', ibcYaCotizado: 3000000, umbralAplicaConSalario: false
    });
    expect(empleado.total).toBeGreaterThan(0);
  });

  it('pasado el umbral, el empleado sí aporta y sin que se le exija de nuevo el piso del IBC', () => {
    // Bruto $3.000.000 -> neto $2.175.000, por encima de 1 SMMLV: hay obligación.
    // El IBC es el 40% del neto ($870.000), por debajo de 1 SMMLV, y NO se sube
    // al piso porque su salario ya cubre esa base mínima.
    const empleado = calcularSeguridadSocial(3000000, { situacionLaboral: 'empleado', ibcYaCotizado: 3000000 });
    expect(empleado.total).toBeGreaterThan(0);
    expect(empleado.ibc).toBeCloseTo(3000000 * 0.725 * 0.40, 4);
    expect(empleado.ibc).toBeLessThan(PARAMETROS_POR_DEFECTO.smmlv);
  });

  it('quien ya cotiza cerca del techo solo aporta por la porción que falta', () => {
    const p = PARAMETROS_POR_DEFECTO;
    const techo = p.smmlv * p.topeIbcSmmlv;

    // Ya cotiza justo en el techo: no debería aportar nada adicional.
    const enElTecho = calcularSeguridadSocial(50000000, {
      situacionLaboral: 'independiente', ibcYaCotizado: techo
    });
    expect(enElTecho.ibc).toBeCloseTo(0, 6);
    expect(enElTecho.total).toBeCloseTo(0, 6);

    // Ya cotiza por la mitad del techo: aporta solo hasta completarlo.
    const aMitad = calcularSeguridadSocial(500000000, {
      situacionLaboral: 'independiente', ibcYaCotizado: techo / 2
    });
    expect(aMitad.ibc).toBeCloseTo(techo / 2, 4);
  });

  it('todas las situaciones declaradas tienen etiqueta y descripción', () => {
    Object.values(SITUACIONES_LABORALES).forEach(s => {
      expect(s.etiqueta).toBeTruthy();
      expect(s.descripcion).toBeTruthy();
    });
  });
});

describe('Constantes por año', () => {
  it('el tope de inversión de 2025 es menor que el de 2026, porque el SMMLV era menor', () => {
    // El tope solo existe para quien tiene piso de 1 SMMLV (el rentista).
    const rentista = (anio) => ({ ...parametrosPorDefecto(anio), situacionLaboral: 'rentista' });
    const max2026 = calcularInversionMaximaOptima(0.12, 'mensual', 12, rentista(2026));
    const max2025 = calcularInversionMaximaOptima(0.12, 'mensual', 12, rentista(2025));
    expect(max2025).toBeLessThan(max2026);
  });

  it('los costos presuntos son configurables y cambian el IBC', () => {
    const conDefecto = calcularSeguridadSocial(20000000, { costosPresuntos: 0.275 });
    const conMayores = calcularSeguridadSocial(20000000, { costosPresuntos: 0.50 });
    expect(conMayores.ibc).toBeLessThan(conDefecto.ibc);
  });
});
