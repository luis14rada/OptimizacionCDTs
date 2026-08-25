import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const aceptarAviso = async (user) => {
  await user.click(screen.getByRole('button', { name: /entiendo y acepto/i }));
};

const renderApp = (ruta = '/') => render(
  <MemoryRouter initialEntries={[ruta]}>
    <App />
  </MemoryRouter>
);

describe('App', () => {
  it('arranca en la pestaña del Optimizador de CDTs', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    expect(screen.getByRole('link', { name: /optimizador de cdts/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { name: /simulador.*optimizador de cdt/i })).toBeInTheDocument();
  });

  it('cambiar a la pestaña de cuenta de ahorros muestra ese comparador y oculta el simulador de CDTs', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    await user.click(screen.getByRole('link', { name: /cuenta de ahorros/i }));

    expect(screen.getByRole('link', { name: /cuenta de ahorros/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /optimizador de cdts/i })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { name: /cuánto te cuesta tu cuenta de ahorros/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /simulador.*optimizador de cdt/i })).not.toBeInTheDocument();
  });

  it('entrar directo a la URL de una herramienta muestra esa herramienta, no la de CDTs', async () => {
    const user = userEvent.setup();
    renderApp('/calculadora-4x1000');
    await aceptarAviso(user);

    expect(screen.getByRole('heading', { level: 1, name: /4×1000: cuánto pagas y cómo dejar de pagarlo/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /simulador.*optimizador de cdt/i })).not.toBeInTheDocument();
  });

  it('una URL que no existe redirige al inicio en vez de mostrar una página en blanco', async () => {
    const user = userEvent.setup();
    renderApp('/esta-ruta-no-existe');
    await aceptarAviso(user);

    expect(screen.getByRole('heading', { level: 1, name: /^optimizador de cdts$/i })).toBeInTheDocument();
  });

  it('el título y la bajada del encabezado cambian según la pestaña activa', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    // Arranca con el título y el texto del Optimizador de CDTs, sin tocar.
    expect(screen.getByRole('heading', { level: 1, name: /^optimizador de cdts$/i })).toBeInTheDocument();
    expect(screen.getByText(/descubre el tope máximo para evitar legalmente aportes a seguridad social/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /cuenta de ahorros/i }));

    // El título y la bajada pasan a describir la pestaña activa; el texto
    // del Optimizador de CDTs desaparece (no se borró, solo dejó de mostrarse).
    expect(screen.getByRole('heading', { level: 1, name: /cuánto te cuesta tu cuenta de ahorros/i })).toBeInTheDocument();
    expect(screen.getByText(/compara la tasa de tu cuenta contra otras del mercado colombiano/i)).toBeInTheDocument();
    expect(screen.queryByText(/descubre el tope máximo para evitar legalmente aportes a seguridad social/i)).not.toBeInTheDocument();
  });

  it('el <title> del documento y la meta description cambian según la ruta activa', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    expect(document.title).toMatch(/calculadora de cdt en colombia/i);

    await user.click(screen.getByRole('link', { name: /4×1000/i }));

    expect(document.title).toMatch(/calculadora 4x1000 colombia 2026/i);
  });

  it('el rótulo "Optimizador Financiero" se mantiene visible sin importar la pestaña activa', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    expect(screen.getByText('Optimizador Financiero')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /cuenta de ahorros/i }));

    expect(screen.getByText('Optimizador Financiero')).toBeInTheDocument();
  });

  it('cambiar a la pestaña de rentabilidad real muestra la cadena completa y oculta las otras', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    await user.click(screen.getByRole('link', { name: /rentabilidad real/i }));

    expect(screen.getByRole('link', { name: /rentabilidad real/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { level: 1, name: /rentabilidad real: la cadena completa/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /simulador.*optimizador de cdt/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /cuánto te cuesta tu cuenta de ahorros/i })).not.toBeInTheDocument();
  });

  it('cambiar a la pestaña "¿Declaro renta?" muestra ese simulador', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    await user.click(screen.getByRole('link', { name: /¿declaro renta\?/i }));

    expect(screen.getByRole('heading', { level: 1, name: /¿me toca declarar renta\?/i })).toBeInTheDocument();
  });

  it('cambiar a la pestaña "4×1000" muestra esa calculadora', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    await user.click(screen.getByRole('link', { name: /4×1000/i }));

    expect(screen.getByRole('heading', { level: 1, name: /4×1000: cuánto pagas y cómo dejar de pagarlo/i })).toBeInTheDocument();
  });

  it('cambiar a la pestaña "Escalera Fogafín" muestra esa herramienta', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    await user.click(screen.getByRole('link', { name: /escalera fogafín/i }));

    expect(screen.getByRole('heading', { level: 1, name: /escalera de cdts y cobertura fogafín/i })).toBeInTheDocument();
  });

  it('cambiar a la pestaña "Costo de tu deuda" muestra esa herramienta', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    await user.click(screen.getByRole('link', { name: /costo de tu deuda/i }));

    expect(screen.getByRole('heading', { level: 1, name: /el costo real de tu deuda/i })).toBeInTheDocument();
  });

  it('cambiar a la pestaña "Costo de tu cuenta" muestra esa herramienta', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    await user.click(screen.getByRole('link', { name: /costo de tu cuenta/i }));

    expect(screen.getByRole('heading', { level: 1, name: /costo total de tener una cuenta/i })).toBeInTheDocument();
  });

  it('cambiar a la pestaña "Fondo de emergencia" muestra esa herramienta', async () => {
    const user = userEvent.setup();
    renderApp();
    await aceptarAviso(user);

    await user.click(screen.getByRole('link', { name: /fondo de emergencia/i }));

    expect(screen.getByRole('heading', { level: 1, name: /^fondo de emergencia$/i })).toBeInTheDocument();
  });
});
