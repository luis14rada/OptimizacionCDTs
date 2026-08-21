import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

/**
 * Almacenamiento en memoria compatible con la interfaz Storage del navegador.
 *
 * Node 22.23+ expone un `localStorage` experimental propio que queda en
 * `undefined` si no se arranca con `--localstorage-file`, y en el entorno de
 * pruebas llega a eclipsar al que provee jsdom. El resultado es que la suite
 * pasa o falla según la versión de Node de cada máquina.
 *
 * Instalando este sustituto, las pruebas de persistencia se ejecutan de verdad
 * y se comportan igual en cualquier entorno.
 */
class AlmacenamientoEnMemoria {
  #datos = new Map();

  get length() {
    return this.#datos.size;
  }

  key(indice) {
    return Array.from(this.#datos.keys())[indice] ?? null;
  }

  getItem(clave) {
    const k = String(clave);
    return this.#datos.has(k) ? this.#datos.get(k) : null;
  }

  setItem(clave, valor) {
    this.#datos.set(String(clave), String(valor));
  }

  removeItem(clave) {
    this.#datos.delete(String(clave));
  }

  clear() {
    this.#datos.clear();
  }
}

const tieneAlmacenamientoUtilizable = () => {
  try {
    return typeof window !== 'undefined' &&
      window.localStorage !== null &&
      window.localStorage !== undefined &&
      typeof window.localStorage.setItem === 'function';
  } catch {
    return false;
  }
};

if (typeof window !== 'undefined' && !tieneAlmacenamientoUtilizable()) {
  Object.defineProperty(window, 'localStorage', {
    value: new AlmacenamientoEnMemoria(),
    configurable: true,
    writable: true
  });
}

// Cada prueba arranca con el almacenamiento vacío: sin esto, el portafolio o
// los parámetros de una prueba se filtrarían a la siguiente.
beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    // Sin almacenamiento disponible no hay nada que limpiar.
  }
});

// jsdom no implementa URL.createObjectURL/revokeObjectURL ni una navegación real
// al hacer clic en un <a download>. Los stubbeamos para que el código de exportación
// (CSV) se pueda probar sin errores, sin necesidad de mockear cada test por separado.
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  window.URL.revokeObjectURL = vi.fn();
}

if (typeof HTMLAnchorElement !== 'undefined') {
  HTMLAnchorElement.prototype.click = vi.fn();
}
