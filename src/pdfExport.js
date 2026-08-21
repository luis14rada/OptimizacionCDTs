import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SMMLV_2026 } from './OptimizationEngine';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const FRECUENCIA_LABELS = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  al_vencimiento: 'Al Vencimiento'
};

const COLOR_PRIMARY = [37, 99, 235]; // primary-600
const COLOR_TEXT = [30, 41, 59]; // slate-800
const COLOR_MUTED = [100, 116, 139]; // slate-500
const COLOR_ORANGE = [234, 88, 12]; // orange-600
const COLOR_ORANGE_BG = [255, 247, 237]; // orange-50
const COLOR_GREEN = [22, 163, 74]; // green-600
const COLOR_GREEN_BG = [240, 253, 244]; // green-50

/**
 * Genera y descarga un PDF con el detalle del portafolio de CDTs.
 * Usa jsPDF + autoTable para tener control total de columnas, paginación
 * automática y encabezados repetidos, en vez de depender de window.print().
 */
export const exportarPortafolioPDF = (cdts, totales) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;

  const fechaGeneracion = new Date().toLocaleString('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  // --- Encabezado ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('Optimizador de CDTs — Reporte de Portafolio', margin, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Generado el ${fechaGeneracion}`, margin, 58);

  // --- Aviso legal ---
  const disclaimer =
    'Este documento es un simulador educativo e informativo. No constituye asesoría contable, tributaria ni legal, ' +
    'y no reemplaza a un contador o asesor profesional. Valida siempre tu caso particular antes de tomar decisiones. ' +
    'Uso bajo tu propio riesgo; no se asume responsabilidad por errores u omisiones.';
  const disclaimerLineas = doc.splitTextToSize(disclaimer, pageWidth - margin * 2 - 16);
  const disclaimerAltura = disclaimerLineas.length * 11 + 14;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 68, pageWidth - margin * 2, disclaimerAltura, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(disclaimerLineas, margin + 8, 68 + 13);

  let cursorY = 68 + disclaimerAltura + 16;

  // --- Banner de estado de seguridad social ---
  const activaSegSocial = totales.segSocialTotal > 0;
  const bannerColor = activaSegSocial ? COLOR_ORANGE_BG : COLOR_GREEN_BG;
  const bannerTextColor = activaSegSocial ? COLOR_ORANGE : COLOR_GREEN;
  const bannerTitulo = activaSegSocial
    ? 'Atención: este portafolio activa pagos de Seguridad Social'
    : 'Portafolio optimizado: no activa pagos de Seguridad Social';
  const bannerDetalle = activaSegSocial
    ? `En uno o más meses la suma de intereses supera 1 SMMLV (${formatCurrency(SMMLV_2026)}). Total acumulado en Seguridad Social: ${formatCurrency(totales.segSocialTotal)}.`
    : `En ningún mes la suma de intereses supera 1 SMMLV (${formatCurrency(SMMLV_2026)}). Sin obligación de cotizar como rentista de capital.`;

  doc.setFillColor(...bannerColor);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 34, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...bannerTextColor);
  doc.text(bannerTitulo, margin + 10, cursorY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(bannerDetalle, margin + 10, cursorY + 26);

  cursorY += 34 + 16;

  // --- Tabla principal (con paginación y encabezados automáticos) ---
  const columnas = [
    'Fecha Venc.', 'Banco', 'Valor Invertido', 'Tasa EA', 'Frecuencia',
    'Intereses Brutos', 'Retención', 'Salud', 'Pensión', 'Seg. Social',
    'Interés Neto', 'Valor Final'
  ];

  const filas = cdts.map(cdt => ([
    cdt.fechaVencimiento,
    cdt.banco,
    formatCurrency(cdt.valor),
    `${cdt.tasaEA}%`,
    FRECUENCIA_LABELS[cdt.frecuenciaPago] || cdt.frecuenciaPago,
    formatCurrency(cdt.totalInteresBruto),
    formatCurrency(cdt.totalRetencion),
    formatCurrency(cdt.totalSalud),
    formatCurrency(cdt.totalPension),
    formatCurrency(cdt.totalSegSocial),
    formatCurrency(cdt.totalInteresNeto),
    formatCurrency(cdt.finalPlazo)
  ]));

  const filaTotales = [
    'TOTALES', '', formatCurrency(totales.inversionTotal), '', '',
    formatCurrency(totales.interesBrutoTotal),
    formatCurrency(totales.retencionTotal),
    formatCurrency(totales.saludTotal),
    formatCurrency(totales.pensionTotal),
    formatCurrency(totales.segSocialTotal),
    formatCurrency(totales.interesNetoTotal),
    formatCurrency(totales.inversionTotal + totales.interesNetoTotal)
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [columnas],
    body: filas,
    foot: [filaTotales],
    theme: 'grid',
    margin: { left: margin, right: margin },
    showFoot: 'lastPage',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 5,
      textColor: COLOR_TEXT,
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: COLOR_TEXT,
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: () => {
      const alturaPagina = doc.internal.pageSize.getHeight();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(
        'Valores de referencia 2026 · SMMLV: $1.750.905 COP · Retención en la fuente: 4% · Costos Presuntos UGPP: 27.5% · No reemplaza asesoría profesional.',
        margin,
        alturaPagina - 16
      );
      doc.text(
        `Página ${doc.internal.getNumberOfPages()}`,
        pageWidth - margin - 60,
        alturaPagina - 16
      );
    }
  });

  const nombreArchivo = `portafolio-cdts-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
};
