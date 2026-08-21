/**
 * Constantes legales por año gravable y parámetros configurables del cálculo.
 *
 * Todo lo que la ley cambia cada año vive aquí, no incrustado en el motor.
 * Así, cuando cambien el SMMLV o una tarifa, se edita una sola tabla.
 */

/**
 * Constantes oficiales por año gravable.
 *
 * `componenteInflacionario` es el porcentaje del rendimiento financiero que es
 * ingreso no constitutivo de renta para personas naturales no obligadas a llevar
 * contabilidad. Se fija por decreto DESPUÉS de terminado el año, así que el año
 * en curso siempre lo tiene en null.
 */
export const CONSTANTES_POR_ANIO = {
  2026: {
    smmlv: 1750905,
    tarifaSalud: 0.125,
    tarifaPension: 0.16,
    costosPresuntos: 0.275,
    topeIbcSmmlv: 25,
    componenteInflacionario: null,
    notaComponente: 'Para 2026 aún no hay decreto: el porcentaje se publica al año siguiente. Puedes activarlo e ingresar el valor cuando salga.'
  },
  2025: {
    smmlv: 1423500,
    tarifaSalud: 0.125,
    tarifaPension: 0.16,
    costosPresuntos: 0.275,
    topeIbcSmmlv: 25,
    componenteInflacionario: 0.5543,
    notaComponente: 'Decreto 898 de 2026: el 55,43% del rendimiento es ingreso no constitutivo de renta.'
  }
};

export const ANIO_POR_DEFECTO = 2026;

/**
 * Opciones de retención en la fuente sobre rendimientos financieros.
 * El valor por defecto es 4%; quien no está obligado a declarar suele tener 7%.
 */
export const OPCIONES_RETENCION = [
  { valor: 0.04, etiqueta: '4% — Declarante de renta', descripcion: 'Tarifa general para quien está obligado a declarar.' },
  { valor: 0.07, etiqueta: '7% — No declarante', descripcion: 'Tarifa que suele aplicarse a quien no está obligado a declarar.' }
];

/**
 * Situación laboral del titular. Determina qué aportes aplican y si vuelve a
 * aplicarse el piso de 1 SMMLV sobre el ingreso de capital.
 *
 * `aplicaPiso: false` significa que la persona YA cotiza por otro ingreso, así
 * que el piso no se exige de nuevo sobre las rentas de capital: se cotiza sobre
 * la base que resulte, sumada a la que ya viene cotizando.
 */
export const SITUACIONES_LABORALES = {
  rentista: {
    etiqueta: 'Rentista de capital',
    descripcion: 'Tus rentas de capital son tu fuente principal de ingreso y no cotizas por otro concepto.',
    aportaSalud: true,
    aportaPension: true,
    aplicaPiso: true,
    pideIbcPrevio: false
  },
  pensionado: {
    etiqueta: 'Pensionado',
    descripcion: 'Ya estás pensionado: aportas a salud pero no a pensión.',
    aportaSalud: true,
    aportaPension: false,
    aplicaPiso: true,
    pideIbcPrevio: false
  },
  empleado: {
    etiqueta: 'Ya cotizo como empleado',
    descripcion: 'Cotizas sobre tu salario. El piso de 1 SMMLV no se exige de nuevo sobre las rentas de capital.',
    aportaSalud: true,
    aportaPension: true,
    aplicaPiso: false,
    pideIbcPrevio: true
  },
  independiente: {
    etiqueta: 'Ya cotizo como independiente',
    descripcion: 'Ya cotizas por otros ingresos. El piso de 1 SMMLV no se exige de nuevo sobre las rentas de capital.',
    aportaSalud: true,
    aportaPension: true,
    aplicaPiso: false,
    pideIbcPrevio: true
  }
};

export const SITUACION_POR_DEFECTO = 'rentista';

/**
 * Construye el juego de parámetros por defecto de un año gravable.
 */
export const parametrosPorDefecto = (anio = ANIO_POR_DEFECTO) => {
  const base = CONSTANTES_POR_ANIO[anio] || CONSTANTES_POR_ANIO[ANIO_POR_DEFECTO];

  return {
    anioGravable: anio,
    smmlv: base.smmlv,
    tarifaSalud: base.tarifaSalud,
    tarifaPension: base.tarifaPension,
    costosPresuntos: base.costosPresuntos,
    topeIbcSmmlv: base.topeIbcSmmlv,

    retencion: 0.04,

    situacionLaboral: SITUACION_POR_DEFECTO,
    ibcYaCotizado: 0,

    // Desactivado por defecto: es un beneficio real pero su porcentaje cambia
    // cada año y para el año en curso todavía no existe decreto.
    componenteInflacionarioActivo: false,
    componenteInflacionario: base.componenteInflacionario ?? 0
  };
};

export const PARAMETROS_POR_DEFECTO = parametrosPorDefecto(ANIO_POR_DEFECTO);
