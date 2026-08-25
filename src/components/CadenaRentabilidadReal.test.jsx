import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CadenaRentabilidadReal from './CadenaRentabilidadReal';

describe('CadenaRentabilidadReal', () => {
  it('arranca con retención del 4% (declarante) y tasa nominal del 10% precargadas', () => {
    render(<CadenaRentabilidadReal />);

    expect(document.getElementById('tasaNominal')).toHaveValue(10);
    expect(document.getElementById('retencion')).toHaveValue('0.04');
  });

  it('con un monto, muestra la cadena completa: nominal, neta de retención y real', async () => {
    const user = userEvent.setup();
    render(<CadenaRentabilidadReal />);

    // Valores por defecto: 10% nominal, retención 4%, saldo 10.000.000.
    // Verificado con Node antes de escribir la prueba.
    await user.type(screen.getByLabelText(/monto a invertir/i), '10000000');

    expect(await screen.findByText(/\$\s?1\.000\.000/)).toBeInTheDocument(); // rendimiento nominal
    expect(screen.getByText(/\$\s?960\.000/)).toBeInTheDocument(); // neto de retención (tasa 9,6%)
    expect(screen.getByText(/3\.37%/)).toBeInTheDocument(); // retorno real (redondeado)
  });

  it('con una tasa nominal alta, avisa que la ganancia real quedó por debajo de la mitad de la nominal', async () => {
    const user = userEvent.setup();
    render(<CadenaRentabilidadReal />);

    await user.type(screen.getByLabelText(/monto a invertir/i), '10000000');

    expect(await screen.findByText(/menos de la mitad de lo que anunciaba la tasa/i)).toBeInTheDocument();
  });

  it('con una tasa nominal baja, avisa que se pierde poder adquisitivo', async () => {
    const user = userEvent.setup();
    render(<CadenaRentabilidadReal />);

    const tasaInput = screen.getByLabelText(/tasa nominal/i);
    await user.clear(tasaInput);
    await user.type(tasaInput, '5');
    await user.type(screen.getByLabelText(/monto a invertir/i), '10000000');

    expect(await screen.findByText(/perdiendo poder adquisitivo/i)).toBeInTheDocument();
  });

  it('cambiar a retención del 7% actualiza la descripción de la tarifa', async () => {
    const user = userEvent.setup();
    render(<CadenaRentabilidadReal />);

    await user.selectOptions(document.getElementById('retencion'), '0.07');

    expect(screen.getByText(/no está obligado a declarar/i)).toBeInTheDocument();
  });

  it('cita la fuente y la fecha de corte de la inflación de referencia', () => {
    render(<CadenaRentabilidadReal />);

    expect(screen.getByText(/IPC, DANE/i)).toBeInTheDocument();
    expect(screen.getByText(/7 de julio de 2026/i)).toBeInTheDocument();
  });
});
