export const SMMLV_2026 = 1750905;
export const COSTOS_PRESUNTOS = 0.275; // 27.50%
export const RETENCION_FUENTE = 0.04; // 4%
export const TARIFA_SALUD = 0.125; // 12.5%
export const TARIFA_PENSION = 0.16; // 16%

export const calcularTasaPeriodica = (tasaEA, periodosAlAno) => {
  return Math.pow(1 + tasaEA, 1 / periodosAlAno) - 1;
};

export const calcularSeguridadSocial = (ingresoBrutoMensual) => {
  if (ingresoBrutoMensual < SMMLV_2026) {
    return { ibc: 0, salud: 0, pension: 0, total: 0, excedeTope: false };
  }
  let ibcCalculado = (ingresoBrutoMensual - (ingresoBrutoMensual * COSTOS_PRESUNTOS)) * 0.40;
  const ibcFinal = Math.max(ibcCalculado, SMMLV_2026);
  const salud = ibcFinal * TARIFA_SALUD;
  const pension = ibcFinal * TARIFA_PENSION;
  const total = salud + pension;
  return { ibc: ibcFinal, salud, pension, total, excedeTope: true };
};

export const calcularInversionMaximaOptima = (tasaEA, frecuenciaPago, plazoMeses = 12) => {
  let tasaPeriodoPago;

  if (frecuenciaPago === 'al_vencimiento') {
    // Si es al vencimiento, recibe todo el interés acumulado en un solo mes.
    // La tasa del periodo corresponde a los meses totales.
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

  const maxInversion = Math.floor(SMMLV_2026 / tasaPeriodoPago) - 1;
  return maxInversion;
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
 * Recalcula todo el portafolio consolidando ingresos por mes calendario.
 * Esto es vital porque la UGPP suma TODOS los ingresos de rentas de capital en el mes.
 */
export const recalcularPortafolio = (cdts) => {
  const flujosPorMes = {};

  const cdtsProcesados = cdts.map(cdt => {
    let mesesPorPeriodo = 1;

    if (cdt.frecuenciaPago === 'trimestral') {
      mesesPorPeriodo = 3;
    } else if (cdt.frecuenciaPago === 'semestral') {
      mesesPorPeriodo = 6;
    } else if (cdt.frecuenciaPago === 'anual') {
      mesesPorPeriodo = 12;
    } else if (cdt.frecuenciaPago === 'al_vencimiento') {
      mesesPorPeriodo = cdt.plazoMeses;
    }

    const tasaPeriodica = calcularTasaPeriodica(cdt.tasaEA / 100, 12);
    const tasaDelPago = Math.pow(1 + tasaPeriodica, mesesPorPeriodo) - 1;
    const inversion = cdt.valor;
    const fechaInicio = new Date(cdt.fechaInicio + 'T12:00:00');

    const flujoCrudo = [];

    for (let mes = 1; mes <= cdt.plazoMeses; mes++) {
      const esMesDePago = (mes % mesesPorPeriodo === 0) || (cdt.frecuenciaPago === 'al_vencimiento' && mes === cdt.plazoMeses);

      if (esMesDePago) {
        const fechaPago = new Date(fechaInicio);
        fechaPago.setMonth(fechaPago.getMonth() + mes);
        const mesKey = `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, '0')}`;

        const interesBruto = inversion * tasaDelPago;
        const retencion = interesBruto * RETENCION_FUENTE;

        flujoCrudo.push({ mesKey, interesBruto, retencion });

        if (!flujosPorMes[mesKey]) flujosPorMes[mesKey] = [];
        flujosPorMes[mesKey].push({
          cdtId: cdt.id,
          interesBruto,
          retencion
        });
      }
    }

    return {
      ...cdt,
      flujoCrudo,
      totalInteresBruto: 0,
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
    const segSocialMes = calcularSeguridadSocial(ingresoBrutoTotalMes);

    pagosEnMes.forEach(pago => {
      const proporcion = pago.interesBruto / ingresoBrutoTotalMes;
      const ssSaludProrrateada = segSocialMes.salud * proporcion;
      const ssPensionProrrateada = segSocialMes.pension * proporcion;
      const ssTotalProrrateada = segSocialMes.total * proporcion;

      const cdtTarget = cdtsProcesados.find(c => c.id === pago.cdtId);
      cdtTarget.totalInteresBruto += pago.interesBruto;
      cdtTarget.totalRetencion += pago.retencion;
      cdtTarget.totalSalud += ssSaludProrrateada;
      cdtTarget.totalPension += ssPensionProrrateada;
      cdtTarget.totalSegSocial += ssTotalProrrateada;
    });

    flujoMensual.push({
      mesKey,
      ingresoBrutoMes: ingresoBrutoTotalMes,
      segSocialMes: segSocialMes.total,
      excedeTope: segSocialMes.excedeTope
    });
  }

  flujoMensual.sort((a, b) => a.mesKey.localeCompare(b.mesKey));

  let totales = {
    inversionTotal: 0,
    interesBrutoTotal: 0,
    retencionTotal: 0,
    saludTotal: 0,
    pensionTotal: 0,
    segSocialTotal: 0,
    interesNetoTotal: 0,
    flujoMensual
  };

  const finalCdts = cdtsProcesados.map(cdt => {
    cdt.totalInteresNeto = cdt.totalInteresBruto - cdt.totalRetencion - cdt.totalSegSocial;
    cdt.finalPlazo = cdt.valor + cdt.totalInteresNeto;

    totales.inversionTotal += cdt.valor;
    totales.interesBrutoTotal += cdt.totalInteresBruto;
    totales.retencionTotal += cdt.totalRetencion;
    totales.saludTotal += cdt.totalSalud;
    totales.pensionTotal += cdt.totalPension;
    totales.segSocialTotal += cdt.totalSegSocial;
    totales.interesNetoTotal += cdt.totalInteresNeto;

    return cdt;
  });

  return { cdts: finalCdts, totales };
};
