import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalculadoraGMF from './CalculadoraGMF';

describe('CalculadoraGMF', () => {
  it('arranca sin cuenta marcada por defecto', () => {
    render(<CalculadoraGMF />);

    expect(screen.getByRole('radio', { name: 'No' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Sí' })).not.toBeChecked();
  });

  it('sin cuenta marcada y movimientos que superan el tope, avisa cuánto se podría ahorrar', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    // $20.000.000/mes. Valores verificados con Node antes de escribir la prueba.
    await user.type(screen.getByLabelText(/movimientos.*promedio al mes/i), '20000000');

    expect(await screen.findByText(/podrías ahorrarte/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?879\.883/)).toBeInTheDocument();
  });

  it('con la cuenta marcada, muestra el GMF sobre el excedente en vez del ahorro potencial', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    await user.click(screen.getByRole('radio', { name: 'Sí' }));
    await user.type(screen.getByLabelText(/movimientos.*promedio al mes/i), '20000000');

    expect(await screen.findByText(/ya aprovechás la exención/i)).toBeInTheDocument();
    expect(screen.queryByText(/podrías ahorrarte/i)).not.toBeInTheDocument();
  });

  it('con la cuenta marcada y movimientos bajo el tope, no paga GMF', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    await user.click(screen.getByRole('radio', { name: 'Sí' }));
    await user.type(screen.getByLabelText(/movimientos.*promedio al mes/i), '5000000');

    expect(await screen.findByText(/no pagás gmf en esta cuenta/i)).toBeInTheDocument();
  });

  it('cita la fuente normativa, incluida la Ley 2277 de 2022', () => {
    render(<CalculadoraGMF />);

    expect(screen.getByText(/Ley 2277 de 2022/i)).toBeInTheDocument();
    expect(screen.getByText(/Ley 1819 de 2016/i)).toBeInTheDocument();
  });
});
