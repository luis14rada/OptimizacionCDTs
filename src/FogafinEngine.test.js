import { describe, it, expect } from 'vitest';
import { evaluarCoberturaPorEntidad, entidadesNecesariasParaCobertura } from './FogafinEngine';

const COBERTURA = 50000000;

describe('evaluarCoberturaPorEntidad', () => {
  it('suma varias posiciones de la misma entidad antes de comparar contra el tope', () => {
    const resultado = evaluarCoberturaPorEntidad(
      [
        { entidad: 'Banco A', monto: 70000000 },
        { entidad: 'Banco A', monto: 10000000 },
        { entidad: 'Banco B', monto: 30000000 }
      ],
      COBERTURA
    );

    const bancoA = resultado.porEntidad.find(e => e.entidad === 'Banco A');
    const bancoB = resultado.porEntidad.find(e => e.entidad === 'Banco B');

    expect(bancoA.monto).toBe(80000000);
    expect(bancoA.cubierto).toBe(50000000);
    expect(bancoA.descubierto).toBe(30000000);

    expect(bancoB.monto).toBe(30000000);
    expect(bancoB.descubierto).toBe(0);

    expect(resultado.totalDescubierto).toBe(30000000);
    expect(resultado.totalInvertido).toBe(110000000);
  });

  it('sin superar el tope en ninguna entidad, no hay nada descubierto', () => {
    const resultado = evaluarCoberturaPorEntidad(
      [{ entidad: 'Banco A', monto: 20000000 }, { entidad: 'Banco B', monto: 20000000 }],
      COBERTURA
    );

    expect(resultado.totalDescubierto).toBe(0);
  });
});

describe('entidadesNecesariasParaCobertura', () => {
  it('calcula cuántas entidades hacen falta para cubrir un monto total (redondeando hacia arriba)', () => {
    // 110.000.000 / 50.000.000 = 2,2 -> 3 entidades.
    expect(entidadesNecesariasParaCobertura(110000000, COBERTURA)).toBe(3);
  });

  it('un monto igual al tope solo necesita una entidad', () => {
    expect(entidadesNecesariasParaCobertura(50000000, COBERTURA)).toBe(1);
  });

  it('con monto 0 no hace falta ninguna entidad', () => {
    expect(entidadesNecesariasParaCobertura(0, COBERTURA)).toBe(0);
  });
});
