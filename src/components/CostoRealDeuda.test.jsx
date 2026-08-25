import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CostoRealDeuda from './CostoRealDeuda';

describe('CostoRealDeuda', () => {
  it('no muestra resultado hasta ingresar monto y tasa', () => {
    render(<CostoRealDeuda />);

    expect(screen.queryByText(/dentro del tope legal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/esto es usura/i)).not.toBeInTheDocument();
  });

  it('con una tasa dentro del tope legal, avisa que está en la ley', async () => {
    const user = userEvent.setup();
    render(<CostoRealDeuda />);

    await user.type(screen.getByLabelText(/monto de la deuda/i), '5000000');
    await user.type(screen.getByLabelText(/tasa que te cobran/i), '25');

    expect(await screen.findByText(/dentro del tope legal/i)).toBeInTheDocument();
  });

  it('con una tasa por encima del tope, avisa que es usura y calcula el sobrecosto', async () => {
    const user = userEvent.setup();
    render(<CostoRealDeuda />);

    // $5.000.000 al 40% E.A. Sobrecosto verificado con Node: $517.250.
    await user.type(screen.getByLabelText(/monto de la deuda/i), '5000000');
    await user.type(screen.getByLabelText(/tasa que te cobran/i), '40');

    expect(await screen.findByText(/esto es usura: un delito/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?517\.250/)).toBeInTheDocument();
  });

  it('con una tasa que triplica el IBC, avisa usura agravada', async () => {
    const user = userEvent.setup();
    render(<CostoRealDeuda />);

    await user.type(screen.getByLabelText(/monto de la deuda/i), '5000000');
    await user.type(screen.getByLabelText(/tasa que te cobran/i), '65');

    expect(await screen.findByText(/usura agravada/i)).toBeInTheDocument();
  });

  it('convierte una tasa mensual a efectiva anual antes de clasificarla', async () => {
    const user = userEvent.setup();
    render(<CostoRealDeuda />);

    await user.type(screen.getByLabelText(/monto de la deuda/i), '5000000');
    await user.click(screen.getByRole('radio', { name: /mensual/i }));
    await user.type(screen.getByLabelText(/tasa que te cobran/i), '20');

    // 20% mensual = 791,61% E.A. -> muy por encima del tope, usura agravada.
    expect((await screen.findAllByText(/791\.61%/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/usura agravada/i)).toBeInTheDocument();
  });

  it('cita la fuente normativa', () => {
    render(<CostoRealDeuda />);

    expect(screen.getByText(/Código Penal/i)).toBeInTheDocument();
    expect(screen.getByText(/Código de Comercio/i)).toBeInTheDocument();
  });
});
