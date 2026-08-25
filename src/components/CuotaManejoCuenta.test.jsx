import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CuotaManejoCuenta from './CuotaManejoCuenta';

describe('CuotaManejoCuenta', () => {
  it('no muestra resultado hasta ingresar algún dato', () => {
    render(<CuotaManejoCuenta />);

    expect(screen.queryByText(/lo que te cuesta al año/i)).not.toBeInTheDocument();
  });

  it('suma cuenta y tarjeta y calcula el costo anual', async () => {
    const user = userEvent.setup();
    render(<CuotaManejoCuenta />);

    await user.type(screen.getByLabelText(/cuota de manejo de la cuenta/i), '13500');
    await user.type(screen.getByLabelText(/cuota de manejo de la tarjeta/i), '5000');

    // (13.500 + 5.000) * 12 = 222.000.
    expect((await screen.findAllByText(/\$\s?222\.000/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/no cobran nada por esto/i)).toBeInTheDocument();
  });

  it('con cuota en $0, avisa que la cuenta no cuesta nada', async () => {
    const user = userEvent.setup();
    render(<CuotaManejoCuenta />);

    await user.type(screen.getByLabelText(/cuota de manejo de la cuenta/i), '0');

    expect(await screen.findByText(/no te cuesta nada por tenerla abierta/i)).toBeInTheDocument();
  });

  it('la tabla de referencia lista la entidad con la cuota más alta reportada', () => {
    render(<CuotaManejoCuenta />);

    expect(screen.getByText('Banco AV Villas')).toBeInTheDocument();
    expect(screen.getByText(/\$\s?44\.030/)).toBeInTheDocument();
  });

  it('cita la fuente y la fecha de corte', () => {
    render(<CuotaManejoCuenta />);

    expect(screen.getByText(/Superintendencia Financiera de Colombia/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de julio de 2026/i)).toBeInTheDocument();
  });
});
