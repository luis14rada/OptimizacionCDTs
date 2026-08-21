import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComparadorEscenarios from './ComparadorEscenarios';
import { recalcularPortafolio } from '../OptimizationEngine';
import { PARAMETROS_POR_DEFECTO } from '../parametros';

const cdt = (overrides = {}) => ({
  id: 1, banco: 'Bancolombia', valor: 80000000, tasaEA: 11.5,
  frecuenciaPago: 'mensual', plazoMeses: 12,
  fechaInicio: '2026-08-21', fechaVencimiento: '2027-08-21', ...overrides
});

const escenario = (nombre) => ({ nombre, cdts: [cdt()], parametros: PARAMETROS_POR_DEFECTO });

describe('ComparadorEscenarios', () => {
  it('pide datos si a algún escenario le faltan CDTs', () => {
    render(
      <ComparadorEscenarios
        escenarioA={escenario('Escenario A')}
        escenarioB={escenario('Escenario B')}
        resultadoA={recalcularPortafolio([cdt()])}
        resultadoB={null}
      />
    );
    expect(screen.getByText(/agrega al menos un cdt en cada escenario/i)).toBeInTheDocument();
  });

  it('dice en pesos cuál escenario conviene cuando cambia la retención', () => {
    const resultadoA = recalcularPortafolio([cdt()], { ...PARAMETROS_POR_DEFECTO, retencion: 0.04 });
    const resultadoB = recalcularPortafolio([cdt()], { ...PARAMETROS_POR_DEFECTO, retencion: 0.07 });

    render(
      <ComparadorEscenarios
        escenarioA={escenario('Escenario A')}
        escenarioB={escenario('Escenario B')}
        resultadoA={resultadoA}
        resultadoB={resultadoB}
      />
    );

    // Con más retención, el escenario A debe salir mejor.
    expect(screen.getByText(/escenario a te deja .* más en intereses netos/i)).toBeInTheDocument();
  });

  it('muestra los supuestos de cada escenario en su encabezado', () => {
    const resultadoA = recalcularPortafolio([cdt()], { ...PARAMETROS_POR_DEFECTO, retencion: 0.04 });
    const resultadoB = recalcularPortafolio([cdt()], { ...PARAMETROS_POR_DEFECTO, retencion: 0.07 });

    render(
      <ComparadorEscenarios
        escenarioA={escenario('Escenario A')} escenarioB={escenario('Escenario B')}
        resultadoA={resultadoA} resultadoB={resultadoB}
      />
    );

    expect(screen.getByText(/2026 · Retención 4% · Rentista de capital/)).toBeInTheDocument();
    expect(screen.getByText(/2026 · Retención 7% · Rentista de capital/)).toBeInTheDocument();
  });

  it('marca como "sin diferencia" los conceptos idénticos', () => {
    const resultado = recalcularPortafolio([cdt()]);
    render(
      <ComparadorEscenarios
        escenarioA={escenario('Escenario A')} escenarioB={escenario('Escenario B')}
        resultadoA={resultado} resultadoB={resultado}
      />
    );
    expect(screen.getAllByText(/sin diferencia/i).length).toBeGreaterThan(0);
  });
});
