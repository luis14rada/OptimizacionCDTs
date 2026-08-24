import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

function ComponenteQueFalla() {
  throw new Error('Fallo de prueba');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza a los hijos con normalidad cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>Todo bien</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('Todo bien')).toBeInTheDocument();
  });

  it('muestra un mensaje de error en vez de pantalla en blanco cuando un hijo falla al renderizar', () => {
    // React imprime el error a consola al capturarlo -- se silencia para que
    // la prueba no ensucie la salida, sin ocultar el comportamiento real.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ComponenteQueFalla />
      </ErrorBoundary>
    );

    expect(screen.getByText(/algo salió mal/i)).toBeInTheDocument();
    expect(screen.queryByText('Todo bien')).not.toBeInTheDocument();
  });

  it('el botón "Recargar página" llama a window.location.reload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reloadMock = vi.fn();
    const ubicacionOriginal = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...ubicacionOriginal, reload: reloadMock }
    });

    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <ComponenteQueFalla />
      </ErrorBoundary>
    );

    await user.click(screen.getByRole('button', { name: /recargar página/i }));
    expect(reloadMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', { configurable: true, value: ubicacionOriginal });
  });
});
