import { PARAMETROS_POR_DEFECTO, SITUACIONES_LABORALES } from './parametros';

/*
 * Estas constantes son los valores por defecto de 2026. El motor ya no las usa
 * directamente: cada función recibe un juego de parámetros configurable por el
 * usuario. Se mantienen exportadas porque la UI las muestra como referencia.
 */
export const SMMLV_2026 = PARAMETROS_POR_DEFECTO.smmlv;
export const COSTOS_PRESUNTOS = PARAMETROS_POR_DEFECTO.costosPresuntos;
export const RETENCION_FUENTE = PARAMETROS_POR_DEFECTO.retencion;
export const TARIFA_SALUD = PARAMETROS_POR_DEFECTO.tarifaSalud;
export const TARIFA_PENSION = PARAMETROS_POR_DEFECTO.tarifaPension;

/**
 * La ley acota el Ingreso Base de Cotización entre un piso de 1 SMMLV
 * y un techo de 25 SMMLV. Sin el techo, los portafolios grandes calculan
 * aportes que nadie tendría que pagar.
 */
export const TOPE_IBC_SMMLV = PARAMETROS_POR_DEFECTO.topeIbcSmmlv;

/**
 * Suma meses a una fecha sin desbordarse cuando el día no existe en el mes
 * destino. `setMonth` nativo convierte el 31 de enero + 1 mes en el 3 de marzo;
 * aquí se ajusta al último día del mes (28 de febrero).
 */
export const sumarMeses = (fecha, meses) => {
  const resultado = new Date(fecha);
  const diaOriginal = resultado.getDate();

  // Nos paramos en el día 1 para que el cambio de mes nunca desborde,
  // y luego fijamos el día acotado al último día real del mes destino.
  resultado.setDate(1);
  resultado.setMonth(resultado.getMonth() + meses);

  const ultimoDiaDelMes = new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate();
  resultado.setDate(Math.min(diaOriginal, ultimoDiaDelMes));

  return resultado;
};

export const calcularTasaPeriodica = (tasaEA, periodosAlAno) => {
  return Math.pow(1 + tasaEA, 1 / periodosAlAno) - 1;
};

/**
 * ¿Se le exige a esta persona el umbral de 1 SMMLV sobre sus rentas de capital?
 *
 * Vive en una sola función porque lo consultan tres lugares: el cálculo de los
 * aportes, el del tope máximo de inversión y los avisos de la interfaz. Tenerlo
 * repetido era justamente lo que hacía que el tope prometiera algo distinto de
 * lo que después cobraba la simulación.
 */
export const exigeUmbralDeCapital = (parametros = PARAMETROS_POR_DEFECTO) => {
  const p = { ...PARAMETROS_POR_DEFECTO, ...parametros };
  const situacion = SITUACIONES_LABORALES[p.situacionLaboral] || SITUACIONES_LABORALES.rentista;
  return p.umbralAplicaConSalario !== false || situacion.aplicaPisoIbc;
};

export const calcularSeguridadSocial = (ingresoBrutoMensual, parametros = PARAMETROS_POR_DEFECTO) => {
  const p = { ...PARAMETROS_POR_DEFECTO, ...parametros };
  const situacion = SITUACIONES_LABORALES[p.situacionLaboral] || SITUACIONES_LABORALES.rentista;

  const sinAporte = { ibc: 0, salud: 0, pension: 0, total: 0, excedeTope: false };

  // Quien no cotiza por ningún otro ingreso solo queda obligado cuando el
  // ingreso del mes alcanza 1 SMMLV. El art. 89 de la Ley 2277 de 2022 mide
  // ese umbral sobre el ingreso NETO (después de costos); `umbralSobreIngresoNeto`
  // permite volver al criterio conservador sobre el bruto. Ver FUENTE_UMBRAL.
  const ingresoNetoMensual = ingresoBrutoMensual - (ingresoBrutoMensual * p.costosPresuntos);
  const ingresoParaUmbral = p.umbralSobreIngresoNeto ? ingresoNetoMensual : ingresoBrutoMensual;

  if (exigeUmbralDeCapital(p) && ingresoParaUmbral < p.smmlv) {
    return sinAporte;
  }
  if (ingresoBrutoMensual <= 0) return sinAporte;

  const ibcDelIngreso = ingresoNetoMensual * 0.40;
  const techo = p.smmlv * p.topeIbcSmmlv;

  let ibcFinal;
  if (situacion.aplicaPisoIbc) {
    // El IBC vive entre el piso de 1 SMMLV y el techo de 25 SMMLV.
    ibcFinal = Math.min(Math.max(ibcDelIngreso, p.smmlv), techo);
  } else {
    // Ya cotiza por otro ingreso: no se exige el piso otra vez, pero el techo
    // aplica sobre la base combinada. Solo se aporta por la porción adicional.
    const ibcPrevio = Math.max(0, p.ibcYaCotizado || 0);
    const combinadoAcotado = Math.min(ibcPrevio + ibcDelIngreso, techo);
    ibcFinal = Math.max(0, combinadoAcotado - ibcPrevio);
  }

  const salud = situacion.aportaSalud ? ibcFinal * p.tarifaSalud : 0;
  const pension = situacion.aportaPension ? ibcFinal * p.tarifaPension : 0;

  return { ibc: ibcFinal, salud, pension, total: salud + pension, excedeTope: ibcFinal > 0 };
};

export const calcularInversionMaximaOptima = (
  tasaEA,
  frecuenciaPago,
  plazoMeses = 12,
  parametros = PARAMETROS_POR_DEFECTO,
  interesMensualYaComprometido = 0
) => {
  const p = { ...PARAMETROS_POR_DEFECTO, ...parametros };

  // Solo hay tope donde hay umbral. Si la persona configuró que ya cotizar por
  // un salario la obliga desde el primer peso, no existe ningún tope "sin
  // seguridad social" y devolver un número sería mentir -- antes se devolvía el
  // mismo de un rentista, y al agregarlo la simulación cobraba los aportes que
  // el tope prometía evitar.
  if (!exigeUmbralDeCapital(p)) return null;

  let tasaPeriodoPago;

  if (frecuenciaPago === 'al_vencimiento') {
    // Al vencimiento se recibe todo el interés acumulado en un solo mes,
    // así que la tasa del periodo corresponde a los meses totales.
    tasaPeriodoPago = Math.pow(1 + tasaEA, plazoMeses / 12) - 1;
  } else {
    let periodosAlAno;
    switch (frecuenciaPago) {
      case 'mensual': periodosAlAno = 12; break;
      case 'trimestral': periodosAlAno = 4; break;
      case 'semestral': periodosAlAno = 2; break;
      case 'anual': periodosAlAno = 1; break;
      default: periodosAlAno = 12;
    }
    tasaPeriodoPago = calcularTasaPeriodica(tasaEA, periodosAlAno);
  }

  // El tope busca que el interés de cada periodo no active la obligación de
  // cotizar. Como el umbral se mide sobre el ingreso neto (art. 89 Ley 2277
  // de 2022), el interés bruto puede llegar más alto antes de cruzarlo.
  const umbralEnBruto = p.umbralSobreIngresoNeto
    ? p.smmlv / (1 - p.costosPresuntos)
    : p.smmlv;

  // El umbral es del MES, no de un CDT: si el portafolio ya recibe intereses
  // en ese mes, lo que queda libre es solo la diferencia. Sin esto, el tope
  // se calculaba como si el CDT nuevo fuera el único y al agregarlo el mes
  // consolidado se pasaba.
  const margen = umbralEnBruto - Math.max(0, interesMensualYaComprometido);
  if (margen <= 0) return 0;

  return Math.max(0, Math.floor(margen / tasaPeriodoPago) - 1);
};

/**
 * Reglas de validación para el formulario de un CDT.
 * Devuelve un objeto { campo: mensaje } solo con los campos que tienen error.
 * Un objeto vacío significa que el formulario es válido.
 */
export const validarCDT = (form) => {
  const errores = {};

  if (!form.banco || !form.banco.trim()) {
    errores.banco = 'Ingresa el nombre del banco o entidad.';
  }

  const valor = parseFloat(form.valor);
  if (!form.valor || Number.isNaN(valor)) {
    errores.valor = 'Ingresa el valor invertido.';
  } else if (valor <= 0) {
    errores.valor = 'El valor invertido debe ser mayor a 0.';
  } else if (valor < 100000) {
    errores.valor = 'Verifica el valor: parece muy bajo para un CDT (mínimo sugerido $100.000).';
  }

  const tasa = parseFloat(form.tasaEA);
  if (!form.tasaEA || Number.isNaN(tasa)) {
    errores.tasaEA = 'Ingresa la tasa E.A.';
  } else if (tasa <= 0) {
    errores.tasaEA = 'La tasa E.A. debe ser mayor a 0.';
  } else if (tasa > 50) {
    errores.tasaEA = 'Verifica la tasa: no debería superar 50% E.A.';
  }

  const plazo = parseInt(form.plazoMeses, 10);
  if (!form.plazoMeses || Number.isNaN(plazo)) {
    errores.plazoMeses = 'Ingresa el plazo en meses.';
  } else if (plazo <= 0) {
    errores.plazoMeses = 'El plazo debe ser de al menos 1 mes.';
  } else if (plazo > 120) {
    errores.plazoMeses = 'Verifica el plazo: no debería superar 120 meses (10 años).';
  } else if (
    form.frecuenciaPago !== 'al_vencimiento' &&
    ((form.frecuenciaPago === 'trimestral' && plazo < 3) ||
      (form.frecuenciaPago === 'semestral' && plazo < 6) ||
      (form.frecuenciaPago === 'anual' && plazo < 12))
  ) {
    errores.plazoMeses = 'El plazo es más corto que la frecuencia de pago elegida.';
  }

  if (!form.fechaInicio) {
    errores.fechaInicio = 'Selecciona la fecha de inicio.';
  } else {
    const fecha = new Date(form.fechaInicio + 'T12:00:00');
    if (Number.isNaN(fecha.getTime())) {
      errores.fechaInicio = 'La fecha de inicio no es válida.';
    }
  }

  return errores;
};

/**
 * Cuántos meses cubre cada pago según la frecuencia pactada.
 */
const mesesPorPeriodoDe = (frecuenciaPago, plazoMeses) => {
  switch (frecuenciaPago) {
    case 'trimestral': return 3;
    case 'semestral': return 6;
    case 'anual': return 12;
    case 'al_vencimiento': return plazoMeses;
    default: return 1; // mensual
  }
};

/**
 * Calendario de pagos del CDT.
 *
 * Cuando el plazo no es múltiplo exacto de la frecuencia, el remanente NO se
 * pierde: se paga al vencimiento como un periodo más corto. Un CDT a 10 meses
 * con pago trimestral paga en los meses 3, 6, 9 y un residuo de 1 mes en el 10.
 */
export const construirCalendarioPagos = (plazoMeses, mesesPorPeriodo) => {
  const pagos = [];
  let mesAcumulado = 0;

  while (mesAcumulado < plazoMeses) {
    const mesesDelPago = Math.min(mesesPorPeriodo, plazoMeses - mesAcumulado);
    mesAcumulado += mesesDelPago;
    pagos.push({ mes: mesAcumulado, mesesDelPago });
  }

  return pagos;
};

/**
 * Recalcula todo el portafolio consolidando ingresos por mes calendario.
 * Esto es vital porque la UGPP suma TODOS los ingresos de rentas de capital en el mes.
 */
export const recalcularPortafolio = (cdts, parametros = PARAMETROS_POR_DEFECTO) => {
  const p = { ...PARAMETROS_POR_DEFECTO, ...parametros };

  // Cuando el componente inflacionario está activo, una parte del rendimiento
  // es ingreso no constitutivo de renta y no entra en la base de retención.
  const porcionGravada = p.componenteInflacionarioActivo
    ? Math.max(0, 1 - (p.componenteInflacionario || 0))
    : 1;

  const flujosPorMes = {};

  const cdtsProcesados = cdts.map(cdt => {
    const mesesPorPeriodo = mesesPorPeriodoDe(cdt.frecuenciaPago, cdt.plazoMeses);
    const tasaMensual = calcularTasaPeriodica(cdt.tasaEA / 100, 12);
    const inversion = cdt.valor;
    const fechaInicio = new Date(cdt.fechaInicio + 'T12:00:00');

    const flujoCrudo = [];

    for (const pago of construirCalendarioPagos(cdt.plazoMeses, mesesPorPeriodo)) {
      const fechaPago = sumarMeses(fechaInicio, pago.mes);
      const mesKey = `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, '0')}`;

      // El interés de cada pago se liquida sobre el capital original:
      // al pagarse periódicamente, no se capitaliza.
      const tasaDelPago = Math.pow(1 + tasaMensual, pago.mesesDelPago) - 1;
      const interesBruto = inversion * tasaDelPago;
      const baseGravada = interesBruto * porcionGravada;
      const retencion = baseGravada * p.retencion;

      flujoCrudo.push({ mesKey, interesBruto, baseGravada, retencion });

      if (!flujosPorMes[mesKey]) flujosPorMes[mesKey] = [];
      flujosPorMes[mesKey].push({ cdtId: cdt.id, banco: cdt.banco, interesBruto, baseGravada, retencion });
    }

    return {
      ...cdt,
      flujoCrudo,
      totalInteresBruto: 0,
      totalBaseNoGravada: 0,
      totalRetencion: 0,
      totalSalud: 0,
      totalPension: 0,
      totalSegSocial: 0,
      totalInteresNeto: 0
    };
  });

  const flujoMensual = [];

  for (const mesKey in flujosPorMes) {
    const pagosEnMes = flujosPorMes[mesKey];
    const ingresoBrutoTotalMes = pagosEnMes.reduce((sum, pago) => sum + pago.interesBruto, 0);
    const segSocialMes = calcularSeguridadSocial(ingresoBrutoTotalMes, p);

    pagosEnMes.forEach(pago => {
      const proporcion = pago.interesBruto / ingresoBrutoTotalMes;

      const cdtTarget = cdtsProcesados.find(c => c.id === pago.cdtId);
      cdtTarget.totalInteresBruto += pago.interesBruto;
      cdtTarget.totalBaseNoGravada += pago.interesBruto - pago.baseGravada;
      cdtTarget.totalRetencion += pago.retencion;
      cdtTarget.totalSalud += segSocialMes.salud * proporcion;
      cdtTarget.totalPension += segSocialMes.pension * proporcion;
      cdtTarget.totalSegSocial += segSocialMes.total * proporcion;
    });

    // Desglose por CDT del mes. El total por sí solo no dice de dónde salió:
    // un mes que dispara seguridad social puede venir de un CDT grande o de
    // tres pequeños que coincidieron, y eso cambia qué se puede reprogramar.
    // Se agrega por `cdtId` porque un mismo CDT podría pagar dos veces en el
    // mes, y se conserva el orden del portafolio para que el color de cada
    // uno no cambie de un mes a otro en la gráfica.
    const aportes = [];
    for (const pago of pagosEnMes) {
      const existente = aportes.find(a => a.cdtId === pago.cdtId);
      if (existente) existente.interesBruto += pago.interesBruto;
      else aportes.push({ cdtId: pago.cdtId, banco: pago.banco, interesBruto: pago.interesBruto });
    }

    flujoMensual.push({
      mesKey,
      ingresoBrutoMes: ingresoBrutoTotalMes,
      segSocialMes: segSocialMes.total,
      excedeTope: segSocialMes.excedeTope,
      aportes
    });
  }

  flujoMensual.sort((a, b) => a.mesKey.localeCompare(b.mesKey));

  const totales = {
    inversionTotal: 0,
    interesBrutoTotal: 0,
    baseNoGravadaTotal: 0,
    retencionTotal: 0,
    saludTotal: 0,
    pensionTotal: 0,
    segSocialTotal: 0,
    interesNetoTotal: 0,
    flujoMensual,
    parametros: p
  };

  const finalCdts = cdtsProcesados.map(cdt => {
    cdt.totalInteresNeto = cdt.totalInteresBruto - cdt.totalRetencion - cdt.totalSegSocial;
    cdt.finalPlazo = cdt.valor + cdt.totalInteresNeto;

    totales.inversionTotal += cdt.valor;
    totales.interesBrutoTotal += cdt.totalInteresBruto;
    totales.baseNoGravadaTotal += cdt.totalBaseNoGravada;
    totales.retencionTotal += cdt.totalRetencion;
    totales.saludTotal += cdt.totalSalud;
    totales.pensionTotal += cdt.totalPension;
    totales.segSocialTotal += cdt.totalSegSocial;
    totales.interesNetoTotal += cdt.totalInteresNeto;

    return cdt;
  });

  return { cdts: finalCdts, totales };
};
