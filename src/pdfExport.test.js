import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { exportarPortafolioPDF } from './pdfExport';
import { PARAMETROS_POR_DEFECTO, parametrosPorDefecto } from './parametros';

/**
 * exportarPortafolioPDF ejecuta jsPDF de verdad (no se mockea el módulo, a
 * diferencia de CDTSimulator.test.jsx, que solo comprueba que se lo llama).
 * Bajo Node, `doc.save()` detecta el entorno y escribe el PDF a disco con
 * `fs.writeFileSync` en vez de disparar una descarga de navegador — confirmado
 * generando un PDF real durante la exploración y borrándolo después. Por eso
 * se espía `fs.writeFileSync` para capturar los bytes sin dejar archivos en
 * el repo, y se inspecciona el contenido como texto: jsPDF con la fuente
 * estándar 'helvetica' sin comprimir escribe el texto de forma literal en el
 * stream del PDF, así que se puede verificar como si fuera un string plano.
 */
let writeSpy;

beforeEach(() => {
  writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
});

afterEach(() => {
  writeSpy.mockRestore();
});

const contenidoPdf = () => {
  const [, buffer] = writeSpy.mock.calls[0];
  return Buffer.from(buffer).toString('latin1');
};

// Mismo formato que usa pdfExport.js internamente. Intl.NumberFormat inserta
// un espacio de no separación (U+00A0) entre "$" y el número, no un espacio
// normal — de ahí que se genere aquí en vez de escribirlo a mano en cada test.
const cop = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(valor);

const cdtEjemplo = (overrides = {}) => ({
  fechaVencimiento: '2026-12-01',
  banco: 'Banco Ejemplo',
  valor: 10000000,
  tasaEA: 11.5,
  frecuenciaPago: 'mensual',
  totalInteresBruto: 1000000,
  totalRetencion: 40000,
  totalSalud: 0,
  totalPension: 0,
  totalSegSocial: 0,
  totalInteresNeto: 960000,
  finalPlazo: 10960000,
  ...overrides
});

const totalesEjemplo = (overrides = {}) => ({
  inversionTotal: 10000000,
  interesBrutoTotal: 1000000,
  retencionTotal: 40000,
  saludTotal: 0,
  pensionTotal: 0,
  segSocialTotal: 0,
  interesNetoTotal: 960000,
  ...overrides
});

describe('exportarPortafolioPDF', () => {
  it('genera el PDF y lo guarda con un nombre de archivo con la fecha del día', () => {
    exportarPortafolioPDF([cdtEjemplo()], totalesEjemplo());

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const [nombreArchivo, buffer] = writeSpy.mock.calls[0];
    expect(nombreArchivo).toMatch(/^portafolio-cdts-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('no lanza y usa los parámetros por defecto si no se pasan', () => {
    expect(() => exportarPortafolioPDF([cdtEjemplo()], totalesEjemplo())).not.toThrow();
    expect(contenidoPdf()).toContain(`Año gravable ${PARAMETROS_POR_DEFECTO.anioGravable}`);
  });

  it('incluye el aviso legal en el documento', () => {
    exportarPortafolioPDF([cdtEjemplo()], totalesEjemplo());
    expect(contenidoPdf()).toContain('no reemplaza a un contador o asesor profesional');
  });

  it('muestra el banner de alerta cuando el portafolio activa seguridad social', () => {
    exportarPortafolioPDF(
      [cdtEjemplo({ totalSegSocial: 150000 })],
      totalesEjemplo({ segSocialTotal: 150000 })
    );

    const contenido = contenidoPdf();
    expect(contenido).toContain('Atenci');
    expect(contenido).toContain('este portafolio activa pagos de Seguridad Social');
    expect(contenido).not.toContain('Portafolio optimizado');
  });

  it('muestra el banner de optimizado cuando el portafolio no activa seguridad social', () => {
    exportarPortafolioPDF([cdtEjemplo()], totalesEjemplo());

    const contenido = contenidoPdf();
    expect(contenido).toContain('Portafolio optimizado: no activa pagos de Seguridad Social');
    expect(contenido).not.toContain('este portafolio activa pagos de Seguridad Social');
  });

  it('usa el SMMLV y el año gravable del año seleccionado, no un valor fijo', () => {
    // A diferencia del bug que tenía PortfolioChart.jsx, este módulo ya recibe
    // el smmlv correcto en `parametros`: se prueba explícitamente para que
    // quede cubierto y no se repita el mismo error aquí en el futuro.
    const parametros2025 = parametrosPorDefecto(2025);

    exportarPortafolioPDF([cdtEjemplo()], totalesEjemplo(), parametros2025);

    const contenido = contenidoPdf();
    expect(contenido).toContain('Año gravable 2025');
    expect(contenido).toContain(`SMMLV 2025: ${cop(1423500)}`);
    expect(contenido).not.toContain('1.750.905');
  });

  it('formatea la fila de totales con el valor final (inversión + interés neto)', () => {
    exportarPortafolioPDF(
      [cdtEjemplo({ valor: 5000000, totalInteresNeto: 500000 })],
      totalesEjemplo({ inversionTotal: 5000000, interesNetoTotal: 500000 })
    );

    // 5.000.000 + 500.000 = 5.500.000
    expect(contenidoPdf()).toContain(cop(5500000));
  });
});
