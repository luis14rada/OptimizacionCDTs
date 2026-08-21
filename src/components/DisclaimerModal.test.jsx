import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisclaimerModal from './DisclaimerModal';

describe('DisclaimerModal', () => {
  it('muestra el aviso legal y llama a onAccept al hacer clic en "Entiendo y acepto"', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();

    render(<DisclaimerModal onAccept={onAccept} />);

    // El aviso debe dejar claro que no reemplaza a un profesional.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/no reemplaza a un contador/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /entiendo y acepto/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('no se cierra al presionar Escape (debe aceptarse explícitamente)', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();

    render(<DisclaimerModal onAccept={onAccept} />);
    await user.keyboard('{Escape}');

    expect(onAccept).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
