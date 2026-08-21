/**
 * Persistencia local del simulador.
 *
 * Todo se guarda en el navegador del usuario y nunca sale de su dispositivo.
 * Cada lectura y escritura va protegida: en modo privado, con las cookies
 * bloqueadas o si se agota la cuota, `localStorage` lanza excepciones y la app
 * debe seguir funcionando igual, simplemente sin recordar nada.
 */

const PREFIJO = 'optimizacioncdts';
const VERSION = 1;

const claveCompleta = (clave) => `${PREFIJO}:v${VERSION}:${clave}`;

export const leerAlmacenado = (clave, porDefecto) => {
  if (typeof window === 'undefined') return porDefecto;

  try {
    const crudo = window.localStorage.getItem(claveCompleta(clave));
    if (crudo === null) return porDefecto;
    const valor = JSON.parse(crudo);
    return valor === null || valor === undefined ? porDefecto : valor;
  } catch {
    // Dato corrupto o almacenamiento no disponible: seguimos con el valor inicial.
    return porDefecto;
  }
};

export const guardarAlmacenado = (clave, valor) => {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(claveCompleta(clave), JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
};

export const borrarAlmacenado = (clave) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(claveCompleta(clave));
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
};
