import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

// El nombre del banco aparece ahora en dos lugares a propósito: la leyenda de
// la gráfica, que desagrega el flujo mensual por CDT, y la tabla del
// portafolio. Las pruebas que hablan de la tabla se acotan a ella para no
// chocar con la leyenda.
const NOMBRE_TABLA = /detalle del portafolio/i;
const enPortafolio = (texto) => within(screen.getByRole('table', { name: NOMBRE_TABLA })).getByText(texto);
const sinEnPortafolio = (texto) => {
  const tabla = screen.queryByRole('table', { name: NOMBRE_TABLA });
  return tabla ? within(tabla).queryByText(texto) : null;
};
// La situación por defecto es "empleado", que no tiene piso de 1 SMMLV. Las
// pruebas sobre el tope y el banner describen al rentista de capital, así que
// lo eligen explícitamente por la interfaz.
const elegirSituacion = async (user, valor) => {
  await user.click(screen.getByRole('button', { name: /ajustar/i }));
  await user.selectOptions(screen.getByLabelText(/tu situación laboral/i), valor);
  await user.click(screen.getByRole('button', { name: /ocultar/i }));
};

const esperarEnPortafolio = async (texto) =>
  within(await screen.findByRole('table', { name: NOMBRE_TABLA })).findByText(texto);

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
    expect(enPortafolio('Bancolombia')).toBeInTheDocument();

    // El formulario se limpia después de agregar.
    expect(screen.getByLabelText(/banco \/ entidad/i)).toHaveValue('');
  });

  it('elimina un CDT y la tabla desaparece si el portafolio queda vacío', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await llenarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));
    expect(await esperarEnPortafolio('Bancolombia')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /eliminar cdt de bancolombia/i }));

    expect(sinEnPortafolio('Bancolombia')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /portafolio de cdts/i })).not.toBeInTheDocument();
  });

  it('avisa si se intenta calcular el tope máximo sin una tasa E.A. válida', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await user.click(screen.getByRole('button', { name: /calcular tope máximo/i }));

    expect(await screen.findByText(/ingresa una tasa e\.a\. válida/i)).toBeInTheDocument();
  });

  it('calcula el tope máximo de inversión para un rentista con una tasa E.A. válida', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await elegirSituacion(user, 'rentista');
    await user.type(screen.getByLabelText(/tasa e\.a/i), '11.5');
    await user.click(screen.getByRole('button', { name: /calcular tope máximo/i }));

    expect(await screen.findByText(/inversión máxima recomendada/i)).toBeInTheDocument();
  });

  it('el empleado también recibe un tope, porque el umbral de 1 SMMLV le aplica igual', async () => {
    // La situación por defecto es empleado. El art. 89 de la Ley 2277 de 2022 no
    // condiciona el umbral a tener salario, así que sí hay un monto por debajo
    // del cual no se activan aportes.
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await user.type(screen.getByLabelText(/tasa e\.a/i), '11.5');
    await user.click(screen.getByRole('button', { name: /calcular tope máximo/i }));

    expect(await screen.findByText(/inversión máxima recomendada/i)).toBeInTheDocument();
  });

  it('con el criterio conservador le dice que no hay tope, en vez de darle un número', async () => {
    // Regresión: el tope se calculaba igual para todas las situaciones y sin
    // mirar este supuesto, así que al agregar ese "tope óptimo" la simulación
    // le cobraba los aportes que el número prometía evitar.
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    await user.selectOptions(screen.getByLabelText(/ese umbral te aplica aunque ya tengas salario/i), 'no');
    await user.click(screen.getByRole('button', { name: /ocultar/i }));

    await user.type(screen.getByLabelText(/tasa e\.a/i), '11.5');
    await user.click(screen.getByRole('button', { name: /calcular tope máximo/i }));

    expect(await screen.findByText(/no existe un tope que te libre de seguridad social/i)).toBeInTheDocument();
    expect(screen.queryByText(/inversión máxima recomendada/i)).not.toBeInTheDocument();
  });

  it('al descargar el PDF, invoca exportarPortafolioPDF con los datos del portafolio', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await llenarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));
    await esperarEnPortafolio('Bancolombia');

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
    await esperarEnPortafolio('Bancolombia');

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
    await esperarEnPortafolio('Bancolombia');
    await user.click(screen.getByRole('button', { name: /comparar escenarios/i }));
    await screen.findByRole('group', { name: /escenario en edición/i });

    await user.click(screen.getByRole('button', { name: /quitar comparación/i }));

    expect(screen.queryByRole('group', { name: /escenario en edición/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /comparación de escenarios/i })).not.toBeInTheDocument();
  });

  it('el banner de seguridad social cambia según si el portafolio supera el tope de 1 SMMLV', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    // Un CDT pequeño con tasa baja no debería activar seguridad social a un rentista.
    await elegirSituacion(user, 'rentista');
    await llenarFormularioValido(user, { valor: '1000000', tasaEA: '5' });
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));

    expect(await screen.findByText(/portafolio está optimizado/i)).toBeInTheDocument();
  });

  it('editar un CDT existente actualiza sus datos en la tabla en vez de duplicar la fila', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await llenarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));
    await esperarEnPortafolio('Bancolombia');

    await user.click(screen.getByRole('button', { name: /editar cdt de bancolombia/i }));

    // El formulario queda lleno con los datos del CDT y el botón cambia de texto.
    expect(screen.getByLabelText(/banco \/ entidad/i)).toHaveValue('Bancolombia');
    expect(screen.getByLabelText(/valor inversión/i)).toHaveValue(10000000);
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/banco \/ entidad/i));
    await user.type(screen.getByLabelText(/banco \/ entidad/i), 'Davivienda');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(await esperarEnPortafolio('Davivienda')).toBeInTheDocument();
    expect(sinEnPortafolio('Bancolombia')).not.toBeInTheDocument();
    // Una sola fila de datos, no dos -- se editó en el lugar, no se duplicó.
    expect(screen.getAllByRole('button', { name: /eliminar cdt/i })).toHaveLength(1);
  });

  it('cancelar la edición no cambia el CDT original y limpia el formulario', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    await llenarFormularioValido(user);
    await user.click(screen.getByRole('button', { name: /agregar cdt a la simulación/i }));
    await esperarEnPortafolio('Bancolombia');

    await user.click(screen.getByRole('button', { name: /editar cdt de bancolombia/i }));
    await user.clear(screen.getByLabelText(/banco \/ entidad/i));
    await user.type(screen.getByLabelText(/banco \/ entidad/i), 'Davivienda');

    await user.click(screen.getByRole('button', { name: /cancelar edición/i }));

    expect(enPortafolio('Bancolombia')).toBeInTheDocument();
    expect(sinEnPortafolio('Davivienda')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/banco \/ entidad/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /agregar cdt a la simulación/i })).toBeInTheDocument();
  });

  it('el botón de ejemplo solo aparece con el portafolio vacío y carga dos CDTs al hacer clic', async () => {
    const user = userEvent.setup();
    render(<CDTSimulator />);

    const botonEjemplo = screen.getByRole('button', { name: /ver un caso de ejemplo/i });
    expect(botonEjemplo).toBeInTheDocument();

    await user.click(botonEjemplo);

    expect(await screen.findByRole('heading', { name: /portafolio de cdts/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /eliminar cdt/i })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /ver un caso de ejemplo/i })).not.toBeInTheDocument();
  });
});
