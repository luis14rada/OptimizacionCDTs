import { describe, it, expect, afterEach } from 'vitest';
import { leerAlmacenado, guardarAlmacenado, borrarAlmacenado } from './almacenamiento';

const conAlmacenamientoRoto = (fn) => {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', { value: undefined, configurable: true, writable: true });
  try {
    return fn();
  } finally {
    if (original) Object.defineProperty(window, 'localStorage', original);
  }
};

describe('almacenamiento', () => {
  afterEach(() => window.localStorage.clear());

  it('el entorno de pruebas siempre ofrece un localStorage utilizable', () => {
    // Node 22.23+ puede dejarlo en undefined; el setup instala un sustituto.
    expect(window.localStorage).toBeDefined();
    expect(typeof window.localStorage.setItem).toBe('function');
  });

  it('guarda y recupera un valor', () => {
    guardarAlmacenado('prueba', { a: 1, b: 'dos' });
    expect(leerAlmacenado('prueba', null)).toEqual({ a: 1, b: 'dos' });
  });

  it('devuelve el valor por defecto cuando la clave no existe', () => {
    expect(leerAlmacenado('inexistente', 'defecto')).toBe('defecto');
  });

  it('devuelve el valor por defecto si el dato guardado está corrupto', () => {
    window.localStorage.setItem('optimizacioncdts:v1:corrupto', '{esto no es json');
    expect(leerAlmacenado('corrupto', [])).toEqual([]);
  });

  it('borra una clave', () => {
    guardarAlmacenado('temporal', 123);
    borrarAlmacenado('temporal');
    expect(leerAlmacenado('temporal', null)).toBeNull();
  });

  it('no revienta si el navegador no tiene localStorage disponible', () => {
    conAlmacenamientoRoto(() => {
      // Este es el caso real de Node 22.23 sin bandera, o de un navegador en
      // modo privado con el almacenamiento bloqueado: la app debe seguir viva.
      expect(() => guardarAlmacenado('x', 1)).not.toThrow();
      expect(guardarAlmacenado('x', 1)).toBe(false);
      expect(leerAlmacenado('x', 'defecto')).toBe('defecto');
      expect(() => borrarAlmacenado('x')).not.toThrow();
    });
  });
});
