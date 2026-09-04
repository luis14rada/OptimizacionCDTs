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
    expect(screen.getByText(/2026 · Retención 4% · Ya cotizo como empleado/)).toBeInTheDocument();
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

  it('no pide el IBC previo a un rentista de capital, que no cotiza por otro ingreso', async () => {
    const user = userEvent.setup();
    montar({ ...PARAMETROS_POR_DEFECTO, situacionLaboral: 'rentista' });
    await user.click(screen.getByRole('button', { name: /ajustar/i }));

    expect(screen.queryByLabelText(/salario mensual sobre el que ya cotizas/i)).not.toBeInTheDocument();
  });

  it('pide el IBC previo por defecto, porque la situación por defecto es empleado', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: /ajustar/i }));
    expect(screen.getByLabelText(/salario mensual sobre el que ya cotizas/i)).toBeInTheDocument();
  });

  it('explica qué valor va en el IBC: el salario base de cotización, sin auxilio de transporte', async () => {
    // La duda real de quien llena el campo es si va el salario del contrato o
    // algo distinto. El texto tiene que responderla sin que toque buscar afuera.
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: /ajustar/i }));

    expect(screen.getByText(/desprendible de nómina/i)).toBeInTheDocument();
    expect(screen.getByText(/auxilio de transporte/i)).toBeInTheDocument();
    expect(screen.getByText(/salario integral/i)).toBeInTheDocument();
    expect(screen.getByText(/Decreto 1833 de 2016/i)).toBeInTheDocument();
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

describe('ParametrosPanel · base del umbral de 1 SMMLV', () => {
  it('viene en «ingreso neto» por defecto y cita la norma con enlaces oficiales', async () => {
    const user = userEvent.setup();
    render(<ParametrosPanel parametros={PARAMETROS_POR_DEFECTO} onCambiar={() => {}} onRestaurar={() => {}} />);
    await user.click(screen.getByRole('button', { name: /ajustar/i }));

    expect(screen.getByLabelText(/el umbral de 1 smmlv se mide sobre/i)).toHaveValue('neto');
    // Hay dos campos que citan la misma norma (la base del umbral y si aplica
    // con salario), así que los enlaces aparecen por duplicado a propósito.
    for (const enlace of screen.getAllByRole('link', { name: /ley 2277 de 2022/i })) {
      expect(enlace).toHaveAttribute('href', expect.stringContaining('ley_2277_2022'));
    }
    for (const enlace of screen.getAllByRole('link', { name: /ugpp/i })) {
      expect(enlace).toHaveAttribute('href', expect.stringContaining('ugpp.gov.co'));
    }
  });

  it('a quien ya cotiza le pregunta si el umbral le aplica, y por defecto dice que sí', async () => {
    const user = userEvent.setup();
    montar(); // por defecto: empleado
    await user.click(screen.getByRole('button', { name: /ajustar/i }));

    expect(screen.getByLabelText(/ese umbral te aplica aunque ya tengas salario/i)).toHaveValue('si');
    expect(screen.getByText(/no hay concepto oficial que resuelva expresamente el caso mixto/i)).toBeInTheDocument();
  });

  it('no le hace esa pregunta a un rentista, que no cotiza por ningún salario', async () => {
    const user = userEvent.setup();
    montar({ ...PARAMETROS_POR_DEFECTO, situacionLaboral: 'rentista' });
    await user.click(screen.getByRole('button', { name: /ajustar/i }));

    expect(screen.queryByLabelText(/ese umbral te aplica aunque ya tengas salario/i)).not.toBeInTheDocument();
  });

  it('permite cambiar a «ingreso bruto» y avisa el cambio', async () => {
    const user = userEvent.setup();
    const onCambiar = vi.fn();
    render(<ParametrosPanel parametros={PARAMETROS_POR_DEFECTO} onCambiar={onCambiar} onRestaurar={() => {}} />);
    await user.click(screen.getByRole('button', { name: /ajustar/i }));

    await user.selectOptions(screen.getByLabelText(/el umbral de 1 smmlv se mide sobre/i), 'bruto');

    expect(onCambiar).toHaveBeenCalledWith(expect.objectContaining({ umbralSobreIngresoNeto: false }));
  });

  it('el resumen avisa cuando se está usando el criterio sobre bruto', () => {
    render(
      <ParametrosPanel
        parametros={{ ...PARAMETROS_POR_DEFECTO, umbralSobreIngresoNeto: false }}
        onCambiar={() => {}}
        onRestaurar={() => {}}
      />
    );
    expect(screen.getByText(/umbral sobre bruto/i)).toBeInTheDocument();
  });
});
