/**
 * Motor de la cadena completa de rentabilidad: de la tasa nominal que anuncia
 * cualquier producto (CDT, fondo, cuenta, bono...) hasta lo que realmente
 * queda después de la retención en la fuente y la inflación.
 *
 * No es específico de un producto -- por eso recibe la tasa nominal como
 * parámetro en vez de tener su propia tabla de entidades. Reutiliza
 * `calcularRetornoReal` de `AhorrosEngine.js` (misma ecuación de Fisher) en
 * vez de duplicarla.
 */
import { calcularRetornoReal } from './AhorrosEngine';

/** Tasa que queda después de descontar la retención en la fuente. */
export const calcularTasaNetaRetencion = (tasaNominalEA, retencion) => {
  return tasaNominalEA * (1 - retencion);
};

/**
 * Calcula cada eslabón de la cadena: nominal -> neta de retención -> real
 * (neta de inflación), tanto en tasa como en pesos sobre el saldo dado.
 *
 * `porcentajeDeLoNominal` es la fracción de la ganancia nominal que sobrevive
 * en términos reales -- puede ser negativa (se pierde poder adquisitivo aunque
 * el saldo nominal haya crecido). Con `tasaNominalEA` de 0% no hay nominal
 * sobre qué medir el porcentaje, así que se reporta como 0 en vez de dividir
 * por cero.
 */
export const calcularCadenaRentabilidad = ({ saldo, tasaNominalEA, retencion, inflacionAnual }) => {
  const tasaNetaRetencion = calcularTasaNetaRetencion(tasaNominalEA, retencion);
  const retornoRealNeto = calcularRetornoReal(tasaNetaRetencion, inflacionAnual);

  const rendimientoNominal = saldo * tasaNominalEA;
  const rendimientoNetoRetencion = saldo * tasaNetaRetencion;
  const gananciaRealPesos = saldo * retornoRealNeto;
  const porcentajeDeLoNominal = tasaNominalEA !== 0 ? retornoRealNeto / tasaNominalEA : 0;

  return {
    tasaNetaRetencion,
    retornoRealNeto,
    rendimientoNominal,
    rendimientoNetoRetencion,
    gananciaRealPesos,
    porcentajeDeLoNominal
  };
};
