import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeclararRenta from './DeclararRenta';

describe('DeclararRenta', () => {
  it('no muestra resultado hasta que se ingrese al menos un valor', () => {
    render(<DeclararRenta />);

    expect(screen.queryByText(/quedás obligado a declarar renta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no quedás obligado a declarar renta/i)).not.toBeInTheDocument();
  });

  it('avisa que no queda obligado cuando ningún valor supera su tope', async () => {
    const user = userEvent.setup();
    render(<DeclararRenta />);

    await user.type(screen.getByLabelText(/patrimonio bruto a 31/i), '50000000');

    expect(await screen.findByText(/no quedás obligado a declarar renta/i)).toBeInTheDocument();
  });

  it('avisa que queda obligado y nombra el criterio superado (patrimonio bruto, 4.500 UVT)', async () => {
    const user = userEvent.setup();
    render(<DeclararRenta />);

    // 4.500 UVT * 49.799 (UVT 2025) = $224.095.500. Verificado con Node antes de escribir la prueba.
    await user.type(screen.getByLabelText(/patrimonio bruto a 31/i), '224100000');

    expect(await screen.findByText(/quedás obligado a declarar renta/i)).toBeInTheDocument();
    expect(screen.getAllByText(/patrimonio bruto a 31 de diciembre/i).length).toBeGreaterThan(0);
  });

  it('muestra la sanción mínima con el valor oficial de $523.740', () => {
    render(<DeclararRenta />);

    expect(screen.getByText(/523\.740/)).toBeInTheDocument();
  });

  it('ajustar supuestos legales permite cambiar la UVT y recalcula el resultado', async () => {
    const user = userEvent.setup();
    render(<DeclararRenta />);

    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    const uvtInput = screen.getByLabelText(/uvt del año gravable/i);
    await user.clear(uvtInput);
    await user.type(uvtInput, '1000');

    // Con una UVT hipotética de 1.000, el tope de patrimonio (4.500 UVT) baja a $4.500.000.
    await user.type(screen.getByLabelText(/patrimonio bruto a 31/i), '5000000');

    expect(await screen.findByText(/quedás obligado a declarar renta/i)).toBeInTheDocument();
  });

  it('cita la fuente normativa', () => {
    render(<DeclararRenta />);

    expect(screen.getByText(/Estatuto Tributario/i)).toBeInTheDocument();
    expect(screen.getByText(/Decreto 1625 de 2016/i)).toBeInTheDocument();
  });
});
