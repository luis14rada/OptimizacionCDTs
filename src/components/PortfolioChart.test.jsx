import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import PortfolioChart from './PortfolioChart';

const SMMLV_2025 = 1423500;
const SMMLV_2026 = 1750905;

const flujoMensual = [
  {
    mesKey: '2026-01', ingresoBrutoMes: 500000, segSocialMes: 0, excedeTope: false,
    aportes: [{ cdtId: 1, banco: 'Bancolombia', interesBruto: 500000 }]
  },
  {
    mesKey: '2026-02', ingresoBrutoMes: 2000000, segSocialMes: 150000, excedeTope: true,
    aportes: [
      { cdtId: 1, banco: 'Bancolombia', interesBruto: 1200000 },
      { cdtId: 2, banco: 'Davivienda', interesBruto: 800000 }
    ]
  }
];

describe('PortfolioChart', () => {
  it('usa el SMMLV recibido por prop para la línea de referencia, no un valor fijo de 2026', () => {
    // Regresión: antes el componente importaba SMMLV_2026 de OptimizationEngine.js
    // sin importar el año gravable que el usuario eligiera en Parámetros. Con
    // 2025 seleccionado, la línea de referencia debía mostrar $1.423.500, no
    // el valor de 2026.
    render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2025} />);

    expect(screen.getByText(/tope 1 smmlv/i)).toHaveTextContent('$ 1.423.500');
    expect(screen.queryByText(/1\.750\.905/)).not.toBeInTheDocument();
  });

  it('sin flujoMensual (vacío o nulo), no renderiza nada', () => {
    const { container: containerVacio } = render(<PortfolioChart flujoMensual={[]} smmlv={SMMLV_2026} />);
    expect(containerVacio).toBeEmptyDOMElement();

    const { container: containerNulo } = render(<PortfolioChart flujoMensual={null} smmlv={SMMLV_2026} />);
    expect(containerNulo).toBeEmptyDOMElement();
  });

  it('renderiza una fila por mes con la etiqueta y el monto formateado', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    // getAllByText porque el mismo dato aparece dos veces a propósito: una en
    // el gráfico visual y otra en la tabla accesible (sr-only) que lo acompaña.
    expect(screen.getAllByText('ene 26').length).toBeGreaterThan(0);
    expect(screen.getAllByText('feb 26').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$ 500.000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$ 2.000.000').length).toBeGreaterThan(0);
  });

  it('un mes que excede el tope se distingue del que no lo excede', () => {
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

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
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    const barraBajoTope = Array.from(container.querySelectorAll('[title]'))
      .find(b => b.title.includes('ene 26'));

    expect(barraBajoTope.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('expone una tabla accesible equivalente al gráfico, con el mismo dato que las barras', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    const tabla = screen.getByRole('table');
    expect(tabla).toHaveAccessibleName(/flujo de intereses brutos por mes/i);
    expect(tabla).toHaveTextContent(/tope de 1 smmlv/i);
    expect(tabla).toHaveTextContent('$ 1.750.905');

    const filas = within(tabla).getAllByRole('row').slice(1); // sin la fila de encabezados
    expect(filas).toHaveLength(2);

    const filaEnero = within(filas[0]);
    expect(filaEnero.getByText('ene 26')).toBeInTheDocument();
    expect(filaEnero.getByText('$ 500.000')).toBeInTheDocument();
    expect(filaEnero.getByText('Bancolombia: $ 500.000')).toBeInTheDocument();
    expect(filaEnero.getByText('No')).toBeInTheDocument();
    expect(filaEnero.getByText('—')).toBeInTheDocument();

    const filaFebrero = within(filas[1]);
    expect(filaFebrero.getByText('feb 26')).toBeInTheDocument();
    expect(filaFebrero.getByText('$ 2.000.000')).toBeInTheDocument();
    expect(filaFebrero.getByText('Sí')).toBeInTheDocument();
    expect(filaFebrero.getByText('$ 150.000')).toBeInTheDocument();
  });

  it('desagrega la barra en un segmento por CDT, con su nombre y su parte del mes', () => {
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    const segmentos = Array.from(container.querySelectorAll('[title]'))
      .filter(s => s.title.includes('feb 26'));

    // Febrero lo aportan dos CDTs: $1.200.000 (60%) y $800.000 (40%).
    expect(segmentos).toHaveLength(2);
    expect(segmentos[0].title).toMatch(/Bancolombia: \$\s?1\.200\.000 \(60% del mes\)/);
    expect(segmentos[1].title).toMatch(/Davivienda: \$\s?800\.000 \(40% del mes\)/);
    expect(segmentos[0].style.width).toBe('60%');
    expect(segmentos[1].style.width).toBe('40%');
  });

  it('un mes aportado por un solo CDT se dibuja con un solo segmento', () => {
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    const segmentos = Array.from(container.querySelectorAll('[title]'))
      .filter(s => s.title.includes('ene 26'));

    expect(segmentos).toHaveLength(1);
    expect(segmentos[0].style.width).toBe('100%');
  });

  it('el desglose se identifica sin hover: leyenda con un color distinto por CDT', () => {
    const { container } = render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

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
    render(<PortfolioChart flujoMensual={dosDelMismoBanco} smmlv={SMMLV_2026} />);

    expect(screen.getAllByText('Bancolombia (1)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bancolombia (2)').length).toBeGreaterThan(0);
  });

  it('el aviso de que un mes genera aportes no depende del color: va también en texto', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    // Regresión: al pasar el color a identificar el CDT, el verde/naranja dejó
    // de señalar el tope. La señal tiene que sobrevivir en texto.
    expect(screen.getByText('paga seg. social')).toBeInTheDocument();
  });

  it('la tabla accesible incluye el desglose por CDT de cada mes', () => {
    render(<PortfolioChart flujoMensual={flujoMensual} smmlv={SMMLV_2026} />);

    const tabla = screen.getByRole('table');
    expect(within(tabla).getByText(/desglose por cdt/i)).toBeInTheDocument();
    expect(within(tabla).getByText('Bancolombia: $ 1.200.000 · Davivienda: $ 800.000')).toBeInTheDocument();
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
    const { container: pegadaAlBorde } = render(<PortfolioChart flujoMensual={mesChico} smmlv={SMMLV_2026} />);
    expect(within(pegadaAlBorde).getByText(/tope 1 smmlv/i).className).toContain('right-1');

    // Al revés: con un mes muy por encima del tope la línea queda a la
    // izquierda y la etiqueta se dibuja hacia la derecha, como siempre.
    const mesGrande = [
      { mesKey: '2026-01', ingresoBrutoMes: 10000000, segSocialMes: 500000, excedeTope: true,
        aportes: [{ cdtId: 1, banco: 'Banco Grande', interesBruto: 10000000 }] }
    ];
    const { container: holgada } = render(<PortfolioChart flujoMensual={mesGrande} smmlv={SMMLV_2026} />);
    expect(within(holgada).getByText(/tope 1 smmlv/i).className).toContain('left-1');
  });
});
