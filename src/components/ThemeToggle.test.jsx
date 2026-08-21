import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  it('en modo claro, muestra la opción de cambiar a oscuro y llama a onToggle', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<ThemeToggle theme="light" onToggle={onToggle} />);

    const boton = screen.getByRole('button', { name: /cambiar a modo oscuro/i });
    await user.click(boton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('en modo oscuro, muestra la opción de cambiar a claro', () => {
    render(<ThemeToggle theme="dark" onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: /cambiar a modo claro/i })).toBeInTheDocument();
  });
});
