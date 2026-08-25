import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const aceptarAviso = async (user) => {
  await user.click(screen.getByRole('button', { name: /entiendo y acepto/i }));
};

describe('App', () => {
  it('arranca en la pestaña del Optimizador de CDTs', async () => {
    const user = userEvent.setup();
    render(<App />);
    await aceptarAviso(user);

    expect(screen.getByRole('tab', { name: /optimizador de cdts/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: /simulador.*optimizador de cdt/i })).toBeInTheDocument();
  });

  it('cambiar a la pestaña de cuenta de ahorros muestra ese comparador y oculta el simulador de CDTs', async () => {
    const user = userEvent.setup();
    render(<App />);
    await aceptarAviso(user);

    await user.click(screen.getByRole('tab', { name: /cuenta de ahorros/i }));

    expect(screen.getByRole('tab', { name: /cuenta de ahorros/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /optimizador de cdts/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('heading', { name: /cuánto te cuesta tu cuenta de ahorros/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /simulador.*optimizador de cdt/i })).not.toBeInTheDocument();
  });
});
