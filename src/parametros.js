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
 * Sobre qué ingreso se mide el umbral que obliga a cotizar seguridad social.
 *
 * El artículo 89 de la Ley 2277 de 2022 obliga a quien tenga "ingresos NETOS
 * mensuales iguales o superiores a un (1) salario mínimo legal mensual
 * vigente" -- netos, o sea después de restar los costos (los presuntos del
 * 27,5% o los reales del art. 107 ET). La UGPP lo confirma en su ABC para
 * rentistas de capital.
 *
 * La diferencia no es menor: con el SMMLV de 2026 y 27,5% de costos, medir
 * sobre el neto mueve el umbral de $1.750.905 a un bruto equivalente de
 * $2.415.041. Se deja configurable porque es una interpretación de norma, no
 * una constante: quien prefiera el criterio conservador (o cuyo contador lo
 * lea distinto) puede medirlo sobre el bruto.
 */
export const FUENTE_UMBRAL = {
  norma: 'Artículo 89 de la Ley 2277 de 2022',
  cita: 'ingresos netos mensuales iguales o superiores a un (1) salario mínimo legal mensual vigente',
  urlLey: 'http://secretariasenado.gov.co/senado/basedoc/ley_2277_2022_pr002.html',
  urlUgpp: 'https://www.ugpp.gov.co/abc_rentistas_capital/'
};

export const OPCIONES_BASE_UMBRAL = [
  {
    valor: true,
    etiqueta: 'Ingreso neto (según la ley)',
    descripcion: 'Resta los costos antes de comparar contra 1 SMMLV, como exige el art. 89 de la Ley 2277 de 2022.'
  },
  {
    valor: false,
    etiqueta: 'Ingreso bruto (más conservador)',
    descripcion: 'Compara el interés sin restar costos. Activa la obligación antes, así que el tope de inversión queda más bajo.'
  }
];

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

    // Por defecto se sigue la ley (neto). Ver FUENTE_UMBRAL más arriba.
    umbralSobreIngresoNeto: true,

    // Desactivado por defecto: es un beneficio real pero su porcentaje cambia
    // cada año y para el año en curso todavía no existe decreto.
    componenteInflacionarioActivo: false,
    componenteInflacionario: base.componenteInflacionario ?? 0
  };
};

export const PARAMETROS_POR_DEFECTO = parametrosPorDefecto(ANIO_POR_DEFECTO);
