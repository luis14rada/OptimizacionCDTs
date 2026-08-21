import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParametrosPanel from './ParametrosPanel';
import { PARAMETROS_POR_DEFECTO } from '../parametros';

const montar = (parametros = PARAMETROS_POR_DEFECTO) => {
  const onCambiar = vi.fn();
  const onRestaurar = vi.fn();
  render(<ParametrosPanel parametros={parametros} onCambiar={onCambiar} onRestaurar={onRestaurar} />);
  return { onCambiar, onRestaurar };
};

describe('ParametrosPanel', () => {
  it('empieza cerrado y muestra un resumen de los valores activos', () => {
    montar();
    expect(screen.getByText(/2026 · Retención 4% · Rentista de capital/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/año gravable/i)).not.toBeInTheDocument();
  });

  it('se abre al pulsar Ajustar', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    expect(screen.getByLabelText(/año gravable/i)).toBeInTheDocument();
  });

  it('permite cambiar la retención a 7%', async () => {
    const user = userEvent.setup();
    const { onCambiar } = montar();
    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    await user.selectOptions(screen.getByLabelText(/retención en la fuente/i), '0.07');

    expect(onCambiar).toHaveBeenCalledWith(expect.objectContaining({ retencion: 0.07 }));
  });

  it('el componente inflacionario viene desactivado y sin campo de porcentaje', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: /ajustar/i }));

    const casilla = screen.getByRole('checkbox', { name: /componente inflacionario/i });
    expect(casilla).not.toBeChecked();
    expect(screen.queryByLabelText(/porcentaje no gravado/i)).not.toBeInTheDocument();
  });

  it('al activar el componente inflacionario aparece el campo de porcentaje', () => {
    montar({ ...PARAMETROS_POR_DEFECTO, componenteInflacionarioActivo: true });
    expect(screen.getByText(/comp\. inflacionario activo/i)).toBeInTheDocument();
  });

  it('advierte que para 2026 todavía no hay decreto del componente inflacionario', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    expect(screen.getByText(/para 2026 aún no hay decreto/i)).toBeInTheDocument();
  });

  it('solo pide el IBC previo cuando la persona ya cotiza por otro ingreso', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: /ajustar/i }));

    // Como rentista no debe pedirlo
    expect(screen.queryByLabelText(/ibc por el que ya cotizas/i)).not.toBeInTheDocument();
  });

  it('pide el IBC previo para quien ya cotiza como empleado', async () => {
    const user = userEvent.setup();
    montar({ ...PARAMETROS_POR_DEFECTO, situacionLaboral: 'empleado' });
    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    expect(screen.getByLabelText(/ibc por el que ya cotizas/i)).toBeInTheDocument();
  });

  it('avisa que los valores son supuestos y hay que validarlos con un contador', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    expect(screen.getByText(/valida el tuyo con un contador/i)).toBeInTheDocument();
  });

  it('el botón de restaurar llama a onRestaurar', async () => {
    const user = userEvent.setup();
    const { onRestaurar } = montar();
    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    await user.click(screen.getByRole('button', { name: /restaurar valores por defecto/i }));
    expect(onRestaurar).toHaveBeenCalledTimes(1);
  });
});
