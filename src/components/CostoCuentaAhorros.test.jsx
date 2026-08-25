import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CostoCuentaAhorros from './CostoCuentaAhorros';

describe('CostoCuentaAhorros', () => {
  it('arranca con Bancolombia como cuenta actual (tasa más baja) y Pibank como alternativa (tasa más alta)', () => {
    render(<CostoCuentaAhorros />);

    expect(document.getElementById('entidadActual')).toHaveValue('Bancolombia');
    expect(document.getElementById('tasaActual')).toHaveValue(0.07);
    expect(document.getElementById('tasaAlternativa')).toHaveValue(11);
  });

  it('cambiar de entidad autocompleta la tasa E.A.', async () => {
    const user = userEvent.setup();
    render(<CostoCuentaAhorros />);

    await user.selectOptions(document.getElementById('entidadActual'), 'Nu Colombia');

    expect(document.getElementById('tasaActual')).toHaveValue(8.75);
  });

  it('elegir "Otra entidad" no sobreescribe la tasa ya ingresada', async () => {
    const user = userEvent.setup();
    render(<CostoCuentaAhorros />);

    const tasaInput = document.getElementById('tasaActual');
    await user.clear(tasaInput);
    await user.type(tasaInput, '3.5');

    await user.selectOptions(document.getElementById('entidadActual'), 'Otra entidad');

    expect(tasaInput).toHaveValue(3.5);
  });

  it('ingresar un saldo muestra el resultado con las cifras correctas', async () => {
    const user = userEvent.setup();
    render(<CostoCuentaAhorros />);

    // Con los valores por defecto (Bancolombia 0,07% vs. Pibank 11%).
    await user.type(screen.getByLabelText(/saldo promedio/i), '10000000');

    expect(await screen.findByText(/\$\s?7\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?1\.100\.000/)).toBeInTheDocument();
    expect(screen.getByText(/estás perdiendo poder adquisitivo/i)).toBeInTheDocument();
  });

  it('muestra el mensaje de ganancia cuando la tasa actual ya supera la inflación', async () => {
    const user = userEvent.setup();
    render(<CostoCuentaAhorros />);

    await user.selectOptions(document.getElementById('entidadActual'), 'Banco Pichincha (Pibank)');
    await user.type(screen.getByLabelText(/saldo promedio/i), '10000000');

    expect(await screen.findByText(/tu plata gana poder adquisitivo/i)).toBeInTheDocument();
  });

  it('la tabla de referencia lista las diez entidades investigadas', () => {
    render(<CostoCuentaAhorros />);

    const entidades = [
      'Banco Pichincha (Pibank)', 'Bansen', 'Finandina', 'Nu Colombia', 'Lulo Bank',
      'Banco Contactar', 'Rappipay', 'Bancamía', 'Banco de Bogotá', 'Bancolombia'
    ];

    const tabla = screen.getByRole('table');
    entidades.forEach(entidad => {
      expect(screen.getAllByText(entidad, { exact: true }).length).toBeGreaterThan(0);
    });
    expect(tabla).toBeInTheDocument();
  });

  it('cita la fuente y la fecha de corte de las tasas', () => {
    render(<CostoCuentaAhorros />);

    expect(screen.getByText(/Superintendencia Financiera de Colombia/i)).toBeInTheDocument();
    expect(screen.getByText(/17 de junio de 2026/i)).toBeInTheDocument();
  });
});
