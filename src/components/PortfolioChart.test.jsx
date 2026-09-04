import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import PortfolioChart from './PortfolioChart';
import { parametrosPorDefecto } from '../parametros';

// El eje de la gráfica es interés BRUTO, así que el límite que se dibuja es el
// umbral expresado en bruto: SMMLV / (1 - costos presuntos).
// 2026: 1.750.905 / 0,725 = $2.415.041 · 2025: 1.423.500 / 0,725 = $1.963.448
const P_2026 = parametrosPorDefecto(2026);
const P_2025 = parametrosPorDefecto(2025);

const flujoMensual = [
  {
    mesKey: '2026-01', ingresoBrutoMes: 500000, segSocialMes: 0, excedeTope: false,
    aportes: [{ cdtId: 1, banco: 'Bancolombia', interesBruto: 500000 }]
  },
  {
    mesKey: '2026-02', ingresoBrutoMes: 2500000, segSocialMes: 150000, excedeTope: true,
    aportes: [
      { cdtId: 1, banco: 'Bancolombia', interesBruto: 1500000 },
      { cdtId: 2, banco: 'Davivienda', interesBruto: 1000000 }
    ]
  }
];

describe('PortfolioChart', () => {
  it('dibuja la línea en el umbral expresado en bruto, no en el SMMLV', () => {
    // Regresión: el eje de la gráfica es interés BRUTO, pero la línea se
    // dibujaba en el SMMLV ($1.750.905), que es el umbral sobre el NETO.
    // Quedaba un 38% a la izquierda de donde nace la obligación, y meses que
    // no pagaban aparecían cruzándola.
    render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    expect(screen.getByText(/límite \$/i)).toHaveTextContent('$ 2.415.041');
    expect(screen.queryByText(/\$ 1\.750\.905/)).not.toBeInTheDocument();
  });

  it('usa los parámetros recibidos por prop: con 2025 el límite es más bajo', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2025} />);

    expect(screen.getByText(/límite \$/i)).toHaveTextContent('$ 1.963.448');
    expect(screen.queryByText(/2\.415\.041/)).not.toBeInTheDocument();
  });

  it('midiendo el umbral sobre el bruto, la línea vuelve al SMMLV', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} parametros={{ ...P_2026, umbralSobreIngresoNeto: false }} />);

    expect(screen.getByText(/límite \$/i)).toHaveTextContent('$ 1.750.905');
  });

  it('sin flujoMensual (vacío o nulo), no renderiza nada', () => {
    const { container: containerVacio } = render(<PortfolioChart flujoMensual={[]} parametros={P_2026} />);
    expect(containerVacio).toBeEmptyDOMElement();

    const { container: containerNulo } = render(<PortfolioChart flujoMensual={null} parametros={P_2026} />);
    expect(containerNulo).toBeEmptyDOMElement();
  });

  it('renderiza una fila por mes con la etiqueta y el monto formateado', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    // getAllByText porque el mismo dato aparece dos veces a propósito: una en
    // el gráfico visual y otra en la tabla accesible (sr-only) que lo acompaña.
    expect(screen.getAllByText('ene 26').length).toBeGreaterThan(0);
    expect(screen.getAllByText('feb 26').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$ 500.000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$ 2.500.000').length).toBeGreaterThan(0);
  });

  it('un mes que excede el tope se distingue del que no lo excede', () => {
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    const barras = container.querySelectorAll('[title]');
    const barraBajoTope = Array.from(barras).find(b => b.title.includes('ene 26'));
    const barraSobreTope = Array.from(barras).find(b => b.title.includes('feb 26'));

    expect(barraBajoTope.title).toMatch(/sin seguridad social/i);
    expect(barraSobreTope.title).toMatch(/seg\. social/i);
  });

  it('el gráfico visual queda oculto para lectores de pantalla (aria-hidden)', () => {
    // Las barras usan `title`, que los lectores de pantalla no anuncian de forma
    // fiable. Con la tabla accesible como fuente de verdad, el gráfico visual no
    // debe anunciarse también -- evita datos duplicados o incompletos.
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    const barraBajoTope = Array.from(container.querySelectorAll('[title]'))
      .find(b => b.title.includes('ene 26'));

    expect(barraBajoTope.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('expone una tabla accesible equivalente al gráfico, con el mismo dato que las barras', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    const tabla = screen.getByRole('table');
    expect(tabla).toHaveAccessibleName(/flujo de intereses brutos por mes/i);
    expect(tabla).toHaveTextContent(/con el límite de/i);
    expect(tabla).toHaveTextContent('$ 2.415.041');

    const filas = within(tabla).getAllByRole('row').slice(1); // sin la fila de encabezados
    expect(filas).toHaveLength(2);

    const filaEnero = within(filas[0]);
    expect(filaEnero.getByText('ene 26')).toBeInTheDocument();
    expect(filaEnero.getByText('$ 500.000')).toBeInTheDocument();
    expect(filaEnero.getByText('Bancolombia: $ 500.000')).toBeInTheDocument();
    expect(filaEnero.getByText('No')).toBeInTheDocument();
    // Dos guiones: enero no está cerca del límite y no paga seguridad social.
    expect(filaEnero.getAllByText('—')).toHaveLength(2);

    const filaFebrero = within(filas[1]);
    expect(filaFebrero.getByText('feb 26')).toBeInTheDocument();
    expect(filaFebrero.getByText('$ 2.500.000')).toBeInTheDocument();
    expect(filaFebrero.getByText('Sí')).toBeInTheDocument();
    expect(filaFebrero.getByText('$ 150.000')).toBeInTheDocument();
  });

  it('desagrega la barra en un segmento por CDT, con su nombre y su parte del mes', () => {
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    const segmentos = Array.from(container.querySelectorAll('[title]'))
      .filter(s => s.title.includes('feb 26'));

    // Febrero lo aportan dos CDTs: $1.200.000 (60%) y $800.000 (40%).
    expect(segmentos).toHaveLength(2);
    expect(segmentos[0].title).toMatch(/Bancolombia: \$\s?1\.500\.000 \(60% del mes\)/);
    expect(segmentos[1].title).toMatch(/Davivienda: \$\s?1\.000\.000 \(40% del mes\)/);
    expect(segmentos[0].style.width).toBe('60%');
    expect(segmentos[1].style.width).toBe('40%');
  });

  it('un mes aportado por un solo CDT se dibuja con un solo segmento', () => {
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    const segmentos = Array.from(container.querySelectorAll('[title]'))
      .filter(s => s.title.includes('ene 26'));

    expect(segmentos).toHaveLength(1);
    expect(segmentos[0].style.width).toBe('100%');
  });

  it('el desglose se identifica sin hover: leyenda con un color distinto por CDT', () => {
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    // La leyenda nombra cada CDT en texto, no solo por color.
    expect(screen.getAllByText('Bancolombia').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Davivienda').length).toBeGreaterThan(0);

    const colores = Array.from(container.querySelectorAll('[title]'))
      .filter(s => s.title.includes('feb 26'))
      .map(s => Array.from(s.classList).find(c => c.startsWith('bg-')));
    expect(colores[0]).not.toBe(colores[1]);
  });

  it('numera los CDTs del mismo banco para que la leyenda no muestre dos entradas iguales', () => {
    const dosDelMismoBanco = [{
      mesKey: '2026-03', ingresoBrutoMes: 300000, segSocialMes: 0, excedeTope: false,
      aportes: [
        { cdtId: 1, banco: 'Bancolombia', interesBruto: 200000 },
        { cdtId: 2, banco: 'Bancolombia', interesBruto: 100000 }
      ]
    }];
    render(<PortfolioChart flujoMensual={dosDelMismoBanco} parametros={P_2026} />);

    expect(screen.getAllByText('Bancolombia (1)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bancolombia (2)').length).toBeGreaterThan(0);
  });

  it('dice en texto por cuánto se pasa del límite, no solo que se pasa', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    // Regresión: al pasar el color a identificar el CDT, el verde/naranja dejó
    // de señalar el tope. La señal tiene que sobrevivir en texto.
    // $2.500.000 - $2.415.041,38 = $84.958,62 -> "$ 84.959".
    expect(screen.getAllByText(/supera el límite por \$\s?84\.959/).length).toBeGreaterThan(0);
  });

  it('la tabla accesible incluye el desglose por CDT de cada mes', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);

    const tabla = screen.getByRole('table');
    expect(within(tabla).getByText(/desglose por cdt/i)).toBeInTheDocument();
    expect(within(tabla).getByText('Bancolombia: $ 1.500.000 · Davivienda: $ 1.000.000')).toBeInTheDocument();
  });

  it('mueve la etiqueta del tope hacia adentro cuando la línea queda pegada al borde', () => {
    // Regresión: con todos los meses muy por debajo del tope, la línea de
    // referencia queda casi al 100% del ancho y su etiqueta se salía de la
    // página, generando scroll horizontal en móvil (medido: 469px de contenido
    // en una pantalla de 375px).
    const mesChico = [
      { mesKey: '2026-01', ingresoBrutoMes: 45000, segSocialMes: 0, excedeTope: false,
        aportes: [{ cdtId: 1, banco: 'Banco Chico', interesBruto: 45000 }] }
    ];
    const { container: pegadaAlBorde } = render(<PortfolioChart flujoMensual={mesChico} parametros={P_2026} />);
    expect(within(pegadaAlBorde).getByText(/límite \$/i).className).toContain('right-1');

    // Al revés: con un mes muy por encima del tope la línea queda a la
    // izquierda y la etiqueta se dibuja hacia la derecha, como siempre.
    const mesGrande = [
      { mesKey: '2026-01', ingresoBrutoMes: 10000000, segSocialMes: 500000, excedeTope: true,
        aportes: [{ cdtId: 1, banco: 'Banco Grande', interesBruto: 10000000 }] }
    ];
    const { container: holgada } = render(<PortfolioChart flujoMensual={mesGrande} parametros={P_2026} />);
    expect(within(holgada).getByText(/límite \$/i).className).toContain('left-1');
  });

  it('avisa cuánto falta cuando el mes queda a un pelo del límite', () => {
    // El caso real que lo motivó: dos meses que en pantalla se ven casi
    // iguales, uno paga y el otro no. $2.415.041,27 queda 11 centavos por
    // debajo del límite de $2.415.041,3793 -- redondeado a pesos, invisible.
    const alFilo = [{
      mesKey: '2027-06', ingresoBrutoMes: 2415041.27, segSocialMes: 0, excedeTope: false,
      aportes: [{ cdtId: 1, banco: 'tyba2', interesBruto: 2415041.27 }]
    }];
    render(<PortfolioChart flujoMensual={alFilo} parametros={P_2026} />);

    expect(screen.getAllByText(/a \$\s?0,11 del límite/).length).toBeGreaterThan(0);
  });

  it('no ensucia con avisos los meses que están lejos del límite', () => {
    const lejos = [{
      mesKey: '2026-01', ingresoBrutoMes: 300000, segSocialMes: 0, excedeTope: false,
      aportes: [{ cdtId: 1, banco: 'Banco Chico', interesBruto: 300000 }]
    }];
    render(<PortfolioChart flujoMensual={lejos} parametros={P_2026} />);

    expect(screen.queryByText(/del límite/)).not.toBeInTheDocument();
    expect(screen.queryByText(/supera el límite/)).not.toBeInTheDocument();
  });

  it('sin umbral aplicable no dibuja la línea ni habla de límite', () => {
    // Con el criterio conservador cualquier renta genera aportes: no hay
    // ningún límite que cruzar, y dibujar la línea sería mentir.
    const sinUmbral = { ...P_2026, situacionLaboral: 'empleado', umbralAplicaConSalario: false };
    render(<PortfolioChart flujoMensual={flujoMensual} parametros={sinUmbral} />);

    expect(screen.queryByText(/límite \$/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('paga seg. social').length).toBeGreaterThan(0);
  });

  it('la línea se mide contra la franja de las barras, no contra toda la fila', () => {
    // Regresión: la línea era hija directa del contenedor de todas las filas,
    // así que su porcentaje se medía contra el ancho completo (mes + barra +
    // monto). Con el límite cerca del máximo de la escala quedaba dibujada
    // encima de la columna de los montos, y las barras parecían no alcanzarla.
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} parametros={P_2026} />);
    const linea = container.querySelector('.border-dashed');
    const franja = linea.parentElement;
    const capa = franja.parentElement;

    // La capa repite la estructura de la fila: espaciador del mes, franja, monto.
    expect(franja.className).toContain('flex-1');
    expect(capa.firstElementChild.className).toContain('w-14');
    expect(capa.lastElementChild.className).toContain('w-24');
    // Y el mismo padding lateral: `inset-0` se posiciona contra el padding box.
    expect(capa.className).toContain('pl-2');
    expect(capa.className).toContain('pr-1');
    // El desplazamiento es un porcentaje puro de la franja, sin offsets sumados.
    expect(linea.style.left).toMatch(/^\d+(\.\d+)?%$/);
  });
});
