import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FondoEmergencia from './FondoEmergencia';

describe('FondoEmergencia', () => {
  it('arranca con 3 meses de cobertura por defecto (el mínimo recomendado)', () => {
    render(<FondoEmergencia />);

    expect(screen.getByLabelText(/meses de cobertura/i)).toHaveValue(3);
  });

  it('con gastos y sin ahorro previo, calcula la meta completa como faltante', async () => {
    const user = userEvent.setup();
    render(<FondoEmergencia />);

    // $2.000.000/mes * 3 meses = $6.000.000.
    await user.type(screen.getByLabelText(/gastos fijos mensuales/i), '2000000');

    expect((await screen.findAllByText(/\$\s?6\.000\.000/)).length).toBeGreaterThan(0);
  });

  it('con ahorro que ya cubre la meta, avisa que está completa', async () => {
    const user = userEvent.setup();
    render(<FondoEmergencia />);

    await user.type(screen.getByLabelText(/gastos fijos mensuales/i), '1000000');
    await user.type(screen.getByLabelText(/ahorro que ya tenés/i), '5000000');

    expect(await screen.findByText(/ya tenés cubierta tu meta/i)).toBeInTheDocument();
  });

  it('cambiar los meses de cobertura recalcula la meta', async () => {
    const user = userEvent.setup();
    render(<FondoEmergencia />);

    await user.type(screen.getByLabelText(/gastos fijos mensuales/i), '1000000');
    const mesesInput = screen.getByLabelText(/meses de cobertura/i);
    await user.clear(mesesInput);
    await user.type(mesesInput, '6');

    // $1.000.000 * 6 = $6.000.000.
    expect((await screen.findAllByText(/\$\s?6\.000\.000/)).length).toBeGreaterThan(0);
  });

  it('cita la estadística de vulnerabilidad ante imprevistos, sin citar una norma legal', () => {
    render(<FondoEmergencia />);

    expect(screen.getAllByText(/Banco W/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no cita una norma/i)).toBeInTheDocument();
  });
});
