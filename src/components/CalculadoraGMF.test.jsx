import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalculadoraGMF from './CalculadoraGMF';

describe('CalculadoraGMF', () => {
  it('arranca sin cuenta marcada', () => {
    render(<CalculadoraGMF />);

    expect(screen.getByRole('radio', { name: 'No' })).toBeChecked();
  });

  it('el resultado principal es el GMF de la transacción, no una proyección anual', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    // $500.000 en una transacción sin marcar: GMF = $500.000 * 0,004 = $2.000.
    await user.type(screen.getByLabelText(/monto de esta transacción/i), '500000');

    expect(await screen.findByText('GMF de esta transacción')).toBeInTheDocument();
    expect(screen.getAllByText(/\$\s?2\.000/).length).toBeGreaterThan(0);
    // La proyección anual no se muestra a menos que se marque como recurrente.
    expect(screen.getByRole('checkbox', { name: /repetir este mismo movimiento/i })).not.toBeChecked();
    expect(screen.queryByText(/en un año pagarías/i)).not.toBeInTheDocument();
  });

  it('marcar "repetís este movimiento todos los meses" muestra la proyección anual como secundaria', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    await user.type(screen.getByLabelText(/monto de esta transacción/i), '20000000');
    await user.click(screen.getByRole('checkbox', { name: /repetir este mismo movimiento/i }));

    // $20.000.000/mes * 12 = $960.000.000 al 4x1000 = $960.000 al año. Verificado con Node.
    expect(await screen.findByText(/en un año pagarías/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?960\.000/)).toBeInTheDocument();
  });

  it('sin cuenta marcada y con excedente sobre el tope, avisa cuánto se podría ahorrar en esa transacción', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    // $20.000.000. Ahorro por transacción verificado con Node: $73.323,6.
    await user.type(screen.getByLabelText(/monto de esta transacción/i), '20000000');

    expect(await screen.findByText(/podrías ahorrarte.*en esta transacción/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?73\.32[34]/)).toBeInTheDocument();
  });

  it('con la cuenta marcada, muestra el GMF sobre el excedente en vez del ahorro potencial', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    await user.click(screen.getByRole('radio', { name: 'Sí' }));
    await user.type(screen.getByLabelText(/monto de esta transacción/i), '20000000');

    expect(await screen.findByText(/ya aprovechas la exención/i)).toBeInTheDocument();
    expect(screen.queryByText(/podrías ahorrarte/i)).not.toBeInTheDocument();
  });

  it('con la cuenta marcada y una transacción bajo el tope, no paga GMF', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    await user.click(screen.getByRole('radio', { name: 'Sí' }));
    await user.type(screen.getByLabelText(/monto de esta transacción/i), '5000000');

    expect(await screen.findByText(/no pagas gmf/i)).toBeInTheDocument();
  });

  it('con el saldo completo en la cuenta, dice cuánto se puede transferir de verdad', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    // Saldo $100.000 sin marcar: 100.000 / 1,004 = 99.601,59 -> $99.601 transferibles y $398 de GMF.
    await user.type(screen.getByLabelText(/monto de esta transacción/i), '100000');

    expect(await screen.findByText(/son todo lo que tienes en la cuenta/i)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?99\.601/)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?398/)).toBeInTheDocument();
  });

  it('con la cuenta marcada y saldo bajo el tope, avisa que se puede transferir todo', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    await user.click(screen.getByRole('radio', { name: 'Sí' }));
    await user.type(screen.getByLabelText(/monto de esta transacción/i), '5000000');

    expect(await screen.findByText(/puedes transferir los .* completos/i)).toBeInTheDocument();
  });

  it('con la cuenta marcada y saldo sobre el tope, solo reserva el GMF del excedente', async () => {
    const user = userEvent.setup();
    render(<CalculadoraGMF />);

    await user.click(screen.getByRole('radio', { name: 'Sí' }));
    await user.type(screen.getByLabelText(/monto de esta transacción/i), '20000000');

    // (20.000.000 + 18.330.900 * 0,004) / 1,004 = 19.993.350,2 -> $19.993.350.
    expect(await screen.findByText(/\$\s?19\.993\.350/)).toBeInTheDocument();
  });

  it('cita la fuente normativa, incluida la Ley 2277 de 2022', () => {
    render(<CalculadoraGMF />);

    expect(screen.getByText(/Ley 2277 de 2022/i)).toBeInTheDocument();
    expect(screen.getByText(/Ley 1819 de 2016/i)).toBeInTheDocument();
  });
});
