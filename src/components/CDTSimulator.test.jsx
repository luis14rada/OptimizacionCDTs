import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CDTSimulator from './CDTSimulator';

// La generación real del PDF (jsPDF) es una librería de terceros: aquí solo
// verificamos que el botón la invoque con los datos correctos, sin ejecutar
// su lógica interna de renderizado.
vi.mock('../pdfExport', () => ({
  exportarPortafolioPDF: vi.fn()
}));

import { exportarPortafolioPDF } from '../pdfExport';

const llenarFormularioValido = async (user, overrides = {}) => {
  const valores = {
    banco: 'Bancolombia',
    valor: '10000000',
    tasaEA: '11.5',
    ...overrides
  };

  await user.type(screen.getByLabelText(/banco \/ entidad/i), valores.banco);
  await user.type(screen.getByLabelText(/valor inversión/i), valores.valor);
  await user.type(screen.getByLabelText(/tasa e\.a/i), valores.tasaEA);
};

describe('CDTSimulator', () => {
  beforeEach(() => {
    // La limpieza del almacenamiento entre pruebas la hace el setup global,
    // que además instala un sustituto cuando el entorno no trae localStorage.
    exportarPortafolioPDF.mockClear();
  });

  it('muestra errores de validación al enviar el formulario vacío', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));

    expect(await screen.findByText(/ingresa el nombre del banco/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresa el valor invertido/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresa la tasa e\.a/i)).toBeInTheDocument();

    // Sin CDTs válidos, no debe aparecer la tabla de portafolio.
    expect(screen.queryByRole('heading', { name: /portafolio de cdts/i })).not.toBeInTheDocument();
  });

  it('agrega un CDT válido y lo muestra en la tabla consolidada', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await llenarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));

    expect(await screen.findByRole('heading', { name: /portafolio de cdts/i })).toBeInTheDocument();
    expect(screen.getByText('Bancolombia')).toBeInTheDocument();

    // El formulario se limpia después de agregar.
    expect(screen.getByLabelText(/banco \/ entidad/i)).toHaveValue('');
  });

  it('elimina un CDT y la tabla desaparece si el portafolio queda vacío', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await llenarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));
    expect(await screen.findByText('Bancolombia')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /eliminar cdt de bancolombia/i }));

    expect(screen.queryByText('Bancolombia')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /portafolio de cdts/i })).not.toBeInTheDocument();
  });

  it('avisa si se intenta calcular el tope máximo sin una tasa E.A. válida', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await user.click(screen.getByRole('button', { name: /calcular tope máximo/i }));

    expect(await screen.findByText(/ingresa una tasa e\.a\. válida/i)).toBeInTheDocument();
  });

  it('calcula el tope máximo de inversión con una tasa E.A. válida', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await user.type(screen.getByLabelText(/tasa e\.a/i), '11.5');
    await user.click(screen.getByRole('button', { name: /calcular tope máximo/i }));

    expect(await screen.findByText(/inversión máxima recomendada/i)).toBeInTheDocument();
  });

  it('al descargar el PDF, invoca exportarPortafolioPDF con los datos del portafolio', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await llenarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));
    await screen.findByText('Bancolombia');

    await user.click(screen.getByRole('button', { name: /descargar pdf/i }));

    expect(exportarPortafolioPDF).toHaveBeenCalledTimes(1);
    const [cdtsArg, totalesArg] = exportarPortafolioPDF.mock.calls[0];
    expect(cdtsArg).toHaveLength(1);
    expect(cdtsArg[0].banco).toBe('Bancolombia');
    expect(totalesArg).toHaveProperty('segSocialTotal');
  });

  it('permite crear un segundo escenario y alternar entre ambos', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await llenarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));
    await screen.findByText('Bancolombia');

    // Antes de comparar no hay selector de escenarios
    expect(screen.queryByRole('group', { name: /escenario en edición/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /comparar escenarios/i }));

    const selector = await screen.findByRole('group', { name: /escenario en edición/i });
    expect(selector).toBeInTheDocument();

    // Al duplicar, el escenario B queda activo y hereda los CDTs de A
    const botonB = screen.getByRole('button', { name: /escenario b/i });
    expect(botonB).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: /comparación de escenarios/i })).toBeInTheDocument();
  });

  it('quitar la comparación devuelve la app a un solo escenario', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await llenarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));
    await screen.findByText('Bancolombia');
    await user.click(screen.getByRole('button', { name: /comparar escenarios/i }));
    await screen.findByRole('group', { name: /escenario en edición/i });

    await user.click(screen.getByRole('button', { name: /quitar comparación/i }));

    expect(screen.queryByRole('group', { name: /escenario en edición/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /comparación de escenarios/i })).not.toBeInTheDocument();
  });

  it('el banner de seguridad social cambia según si el portafolio supera el tope de 1 SMMLV', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    // Un CDT pequeño con tasa baja no debería activar seguridad social.
    await llenarFormularioValido(user, { valor: '1000000', tasaEA: '5' });
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));

    expect(await screen.findByText(/portafolio está optimizado/i)).toBeInTheDocument();
  });
});
