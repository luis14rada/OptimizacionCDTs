import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EscaleraCDTsFogafin from './EscaleraCDTsFogafin';

describe('EscaleraCDTsFogafin', () => {
  it('arranca con una sola fila vacía y sin resultado', () => {
    render(<EscaleraCDTsFogafin />);

    expect(screen.getAllByLabelText(/^entidad$/i)).toHaveLength(1);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('agregar otra entidad crea una fila nueva, con etiqueta accesible aunque no se vea', async () => {
    const user = userEvent.setup();
    render(<EscaleraCDTsFogafin />);

    await user.click(screen.getByRole('button', { name: /agregar otra entidad/i }));

    expect(screen.getAllByLabelText(/^entidad$/i)).toHaveLength(2);
    expect(document.querySelectorAll('input[id^="entidad-"]')).toHaveLength(2);
  });

  it('con un monto por debajo del tope, todo queda cubierto', async () => {
    const user = userEvent.setup();
    render(<EscaleraCDTsFogafin />);

    await user.type(screen.getByLabelText(/^entidad$/i), 'Bancolombia');
    await user.type(screen.getByLabelText(/monto en esa entidad/i), '30000000');

    expect(await screen.findByText(/todo lo que listaste queda cubierto/i)).toBeInTheDocument();
  });

  it('con un monto por encima del tope en una sola entidad, avisa cuánto queda sin cobertura', async () => {
    const user = userEvent.setup();
    render(<EscaleraCDTsFogafin />);

    // $80.000.000 en una sola entidad, tope $50.000.000 -> $30.000.000 sin cobertura.
    await user.type(screen.getByLabelText(/^entidad$/i), 'Bancolombia');
    await user.type(screen.getByLabelText(/monto en esa entidad/i), '80000000');

    expect(await screen.findByText(/sin cobertura de fogafín/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?30\.000\.000 sin cobertura/i)).toBeInTheDocument();
  });

  it('suma varias filas de la misma entidad antes de comparar contra el tope', async () => {
    const user = userEvent.setup();
    render(<EscaleraCDTsFogafin />);

    await user.type(screen.getByLabelText(/^entidad$/i), 'Bancolombia');
    await user.type(screen.getByLabelText(/monto en esa entidad/i), '30000000');

    await user.click(screen.getByRole('button', { name: /agregar otra entidad/i }));
    const entidadInputs = document.querySelectorAll('input[id^="entidad-"]');
    const montoInputs = document.querySelectorAll('input[id^="monto-"]');
    await user.type(entidadInputs[1], 'Bancolombia');
    await user.type(montoInputs[1], '40000000');

    // 30M + 40M = 70M en la misma entidad -> $20.000.000 sin cobertura.
    expect(await screen.findByText(/\$\s?20\.000\.000 sin cobertura/i)).toBeInTheDocument();
  });

  it('cita la fuente normativa', () => {
    render(<EscaleraCDTsFogafin />);

    expect(screen.getByText(/Resolución 002 de 2017/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Fogafín/i).length).toBeGreaterThan(0);
  });
});
