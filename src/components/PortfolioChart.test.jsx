import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import PortfolioChart from './PortfolioChart';

const SMMLV_2025 = 1423500;
const SMMLV_2026 = 1750905;

const flujoMensual = [
  { mesKey: '2026-01', ingresoBrutoMes: 500000, segSocialMes: 0, excedeTope: false },
  { mesKey: '2026-02', ingresoBrutoMes: 2000000, segSocialMes: 150000, excedeTope: true }
];

describe('PortfolioChart', () => {
  it('usa el SMMLV recibido por prop para la línea de referencia, no un valor fijo de 2026', () => {
    // Regresión: antes el componente importaba SMMLV_2026 de OptimizationEngine.js
    // sin importar el año gravable que el usuario eligiera en Parámetros. Con
    // 2025 seleccionado, la línea de referencia debía mostrar $1.423.500, no
    // el valor de 2026.
    render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2025} />);

    expect(screen.getByText(/tope 1 smmlv/i)).toHaveTextContent('$ 1.423.500');
    expect(screen.queryByText(/1\.750\.905/)).not.toBeInTheDocument();
  });

  it('sin flujoMensual (vacío o nulo), no renderiza nada', () => {
    const { container: containerVacio } = render(<PortfolioChart flujoMensual={[]} smmlv={SMMLV_2026} />);
    expect(containerVacio).toBeEmptyDOMElement();

    const { container: containerNulo } = render(<PortfolioChart flujoMensual={null} smmlv={SMMLV_2026} />);
    expect(containerNulo).toBeEmptyDOMElement();
  });

  it('renderiza una fila por mes con la etiqueta y el monto formateado', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    // getAllByText porque el mismo dato aparece dos veces a propósito: una en
    // el gráfico visual y otra en la tabla accesible (sr-only) que lo acompaña.
    expect(screen.getAllByText('ene 26').length).toBeGreaterThan(0);
    expect(screen.getAllByText('feb 26').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$ 500.000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$ 2.000.000').length).toBeGreaterThan(0);
  });

  it('un mes que excede el tope se distingue del que no lo excede', () => {
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    const barras = container.querySelectorAll('[title]');
    const barraBajoTope = Array.from(barras).find(b => b.title.includes('ene 26'));
    const barraSobreTope = Array.from(barras).find(b => b.title.includes('feb 26'));

    expect(barraBajoTope.title).toMatch(/sin seguridad social/i);
    expect(barraSobreTope.title).toMatch(/seg\. social/i);
  });

  it('el gráfico visual queda oculto para lectores de pantalla (aria-hidden)', () => {
    // Las barras usan `title`, que los lectores de pantalla no anuncian de forma
    // fiable. Con la tabla accesible como fuente de verdad, el gráfico visual no
    // debe anunciarse también -- evita datos duplicados o incompletos.
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    const barraBajoTope = Array.from(container.querySelectorAll('[title]'))
      .find(b => b.title.includes('ene 26'));

    expect(barraBajoTope.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('expone una tabla accesible equivalente al gráfico, con el mismo dato que las barras', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    const tabla = screen.getByRole('table');
    expect(tabla).toHaveAccessibleName(/flujo de intereses brutos por mes/i);
    expect(tabla).toHaveTextContent(/tope de 1 smmlv/i);
    expect(tabla).toHaveTextContent('$ 1.750.905');

    const filas = within(tabla).getAllByRole('row').slice(1); // sin la fila de encabezados
    expect(filas).toHaveLength(2);

    const filaEnero = within(filas[0]);
    expect(filaEnero.getByText('ene 26')).toBeInTheDocument();
    expect(filaEnero.getByText('$ 500.000')).toBeInTheDocument();
    expect(filaEnero.getByText('No')).toBeInTheDocument();
    expect(filaEnero.getByText('—')).toBeInTheDocument();

    const filaFebrero = within(filas[1]);
    expect(filaFebrero.getByText('feb 26')).toBeInTheDocument();
    expect(filaFebrero.getByText('$ 2.000.000')).toBeInTheDocument();
    expect(filaFebrero.getByText('Sí')).toBeInTheDocument();
    expect(filaFebrero.getByText('$ 150.000')).toBeInTheDocument();
  });
});
