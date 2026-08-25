/**
 * Datos de cada pestaña/ruta de la app -- fuente única de verdad para el
 * routing (`App.jsx`), los meta tags por página (`useDocumentMeta.js`) y el
 * sitemap (`scripts/generar-sitemap.js`).
 *
 * Vive en un archivo aparte, sin JSX ni imports de React, para que
 * `generar-sitemap.js` lo pueda importar directo con Node en el build --
 * `App.jsx` importa este archivo y le agrega la referencia al componente de
 * cada pestaña, que sí necesita JSX.
 *
 * `slug` define la URL (CDTs se queda en la raíz, es la pestaña original).
 * `metaTitulo`/`metaDescripcion` son lo que ve un buscador en
 * `<title>`/meta description -- pensados para calzar con cómo se busca cada
 * cosa, pueden ser más literales que "titulo"/"descripcion", que es lo que
 * lee una persona en pantalla.
 */
export const RUTAS = [
  {
    id: 'cdts',
    slug: '',
    etiqueta: 'Optimizador de CDTs',
    titulo: 'Optimizador de CDTs',
    descripcion: 'Calcula la rentabilidad real de tus inversiones en Colombia y descubre el tope máximo para evitar legalmente aportes a seguridad social como rentista de capital.',
    metaTitulo: 'Calculadora de CDT en Colombia: rentabilidad real y tope de seguridad social',
    metaDescripcion: 'Calculadora gratuita de CDTs en Colombia: rentabilidad real después de retención, consolidación mensual UGPP y tope máximo para no cotizar seguridad social.'
  },
  {
    id: 'ahorros',
    slug: 'comparar-cuentas-de-ahorro',
    etiqueta: 'Cuenta de ahorros',
    titulo: '¿Cuánto te cuesta tu cuenta de ahorros?',
    descripcion: 'Compara la tasa de tu cuenta contra otras del mercado colombiano y contra la inflación, para saber si tu plata gana o pierde poder adquisitivo real.',
    metaTitulo: 'Comparador de cuentas de ahorro en Colombia: ¿cuál rinde más?',
    metaDescripcion: 'Compará la tasa de tu cuenta de ahorros contra otras del mercado colombiano y contra la inflación. Datos reales de la Superfinanciera, con fuente y fecha.'
  },
  {
    id: 'cadena-rentabilidad',
    slug: 'rentabilidad-real',
    etiqueta: 'Rentabilidad real',
    titulo: 'Rentabilidad real: la cadena completa',
    descripcion: 'De la tasa nominal que anuncia cualquier producto hasta lo que realmente queda después de la retención en la fuente y la inflación.',
    metaTitulo: 'Calculadora de rentabilidad real: retención en la fuente e inflación',
    metaDescripcion: 'Calculá cuánto te queda realmente de la tasa nominal de un CDT, fondo o cuenta después de la retención en la fuente y la inflación en Colombia.'
  },
  {
    id: 'declarar-renta',
    slug: 'declarar-renta',
    etiqueta: '¿Declaro renta?',
    titulo: '¿Me toca declarar renta?',
    descripcion: 'Revisa los cinco topes del Estatuto Tributario para saber si quedas obligado a declarar renta este año.',
    metaTitulo: '¿Debo declarar renta en Colombia 2026? Calculadora de los 5 topes',
    metaDescripcion: 'Calculadora gratuita: revisá los cinco topes del Estatuto Tributario (patrimonio, ingresos, consumos, consignaciones) para saber si te toca declarar renta.'
  },
  {
    id: 'gmf',
    slug: 'calculadora-4x1000',
    etiqueta: '4×1000',
    titulo: '4×1000: cuánto pagas y cómo dejar de pagarlo',
    descripcion: 'Calcula cuánto te cobra el Gravamen a los Movimientos Financieros y cuánto ahorrarías marcando una cuenta como exenta.',
    metaTitulo: 'Calculadora 4x1000 Colombia 2026: cuánto pagas y cómo evitarlo',
    metaDescripcion: 'Calculadora del Gravamen a los Movimientos Financieros (4x1000): cuánto pagás por transacción y cuánto ahorrarías marcando una cuenta como exenta.'
  },
  {
    id: 'fogafin',
    slug: 'cobertura-fogafin',
    etiqueta: 'Escalera Fogafín',
    titulo: 'Escalera de CDTs y cobertura Fogafín',
    descripcion: 'Reparte tu plata entre entidades para que el seguro de depósitos cubra todo lo que tienes invertido.',
    metaTitulo: 'Calculadora cobertura Fogafín: cuánto cubre el seguro de depósitos',
    metaDescripcion: 'Calculá cuánto de tu plata queda cubierta por el seguro de depósitos de Fogafín ($50 millones por entidad) y cuántas entidades necesitás para cubrir todo.'
  },
  {
    id: 'costo-deuda',
    slug: 'tasa-de-usura',
    etiqueta: 'Costo de tu deuda',
    titulo: 'El costo real de tu deuda',
    descripcion: 'Compara la tasa que te cobran contra la tasa de usura y descubre si estás pagando de más -- o algo ilegal.',
    metaTitulo: 'Calculadora de tasa de usura Colombia 2026: ¿te cobran de más?',
    metaDescripcion: 'Calculadora de tasa de usura en Colombia: compará la tasa que te cobran contra el tope legal vigente y descubrí si es delito de usura.'
  },
  {
    id: 'cuota-manejo',
    slug: 'cuota-de-manejo',
    etiqueta: 'Costo de tu cuenta',
    titulo: 'Costo total de tener una cuenta',
    descripcion: 'Suma lo que te cobra tu banco por cuota de manejo y tarjeta débito, y mira cuánto es al año.',
    metaTitulo: 'Calculadora cuota de manejo: cuánto te cobra tu banco al año',
    metaDescripcion: 'Calculá cuánto te cobra tu banco al año por cuota de manejo y tarjeta débito, y compará contra entidades que no cobran nada.'
  },
  {
    id: 'fondo-emergencia',
    slug: 'fondo-de-emergencia',
    etiqueta: 'Fondo de emergencia',
    titulo: 'Fondo de emergencia',
    descripcion: 'Calcula cuánto necesitas ahorrado para cubrir varios meses de gastos si algo imprevisto pasa.',
    metaTitulo: 'Calculadora de fondo de emergencia: ¿cuánto debo ahorrar?',
    metaDescripcion: 'Calculá cuánto necesitás ahorrado en tu fondo de emergencia según tus gastos fijos mensuales y cuánto te falta para llegar a la meta.'
  }
];

export const rutaDe = (tab) => (tab.slug === '' ? '/' : `/${tab.slug}`);
