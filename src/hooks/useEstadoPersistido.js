import { useEffect, useState } from 'react';
import { leerAlmacenado, guardarAlmacenado } from '../almacenamiento';

/**
 * Como useState, pero recordando el valor entre visitas en el navegador.
 * Si el almacenamiento no está disponible, se comporta exactamente como useState.
 */
export default function useEstadoPersistido(clave, valorInicial) {
  const [valor, setValor] = useState(() => {
    // Igual que useState, el valor inicial puede venir como función para que
    // el cálculo (o la lectura de claves antiguas) solo ocurra en el montaje.
    const inicial = typeof valorInicial === 'function' ? valorInicial() : valorInicial;
    return leerAlmacenado(clave, inicial);
  });

  useEffect(() => {
    guardarAlmacenado(clave, valor);
  }, [clave, valor]);

  return [valor, setValor];
}
