import React, { useState } from 'react';
import { evaluarCoberturaPorEntidad, entidadesNecesariasParaCobertura } from '../FogafinEngine';
import { COBERTURA_MAXIMA_FOGAFIN, FUENTE_FOGAFIN } from '../parametrosFogafin';
import Campo from './Campo';

const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const FILA_VACIA = () => ({ id: null, entidad: '', monto: '' });

export default function EscaleraCDTsFogafin() {
  const [posiciones, setPosiciones] = useState(() => [{ id: Date.now(), entidad: '', monto: '' }]);
  const [coberturaMaxima, setCoberturaMaxima] = useState(COBERTURA_MAXIMA_FOGAFIN);
  const [ajustarAbierto, setAjustarAbierto] = useState(false);

  const cambiarFila = (id, campo, valor) => {
    setPosiciones(prev => prev.map(p => (p.id === id ? { ...p, [campo]: valor } : p)));
  };

  const agregarFila = () => {
    setPosiciones(prev => [...prev, { ...FILA_VACIA(), id: Date.now() }]);
  };

  const eliminarFila = (id) => {
    setPosiciones(prev => prev.filter(p => p.id !== id));
  };

  const posicionesValidas = posiciones
    .map(p => ({ entidad: p.entidad.trim(), monto: parseFloat(p.monto) || 0 }))
    .filter(p => p.entidad && p.monto > 0);

  const resultado = posicionesValidas.length > 0
    ? evaluarCoberturaPorEntidad(posicionesValidas, coberturaMaxima)
    : null;

  const entidadesSugeridas = resultado ? entidadesNecesariasParaCobertura(resultado.totalInvertido, coberturaMaxima) : 0;

  return (
    <div className="space-y-8">
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary-900 dark:text-primary-100">Escalera de CDTs y cobertura Fogafín</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            El seguro de depósitos cubre hasta {formatCurrency(coberturaMaxima)} por persona, <strong>por entidad</strong> --
            todo lo que tengas en el mismo banco (CDTs, ahorros, corriente) se suma para ese único tope. Lista dónde
            tienes tu plata para ver si algo quedó sin cobertura.
          </p>
        </div>

        <div className="space-y-3">
          {posiciones.map((p, i) => (
            <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div className="space-y-1.5">
                {i === 0 && <label htmlFor={`entidad-${p.id}`} className="text-sm font-semibold">Entidad</label>}
                <input
                  id={`entidad-${p.id}`}
                  type="text"
                  className="glass-input"
                  value={p.entidad}
                  onChange={e => cambiarFila(p.id, 'entidad', e.target.value)}
                  placeholder="Ej: Bancolombia"
                  aria-label={i === 0 ? undefined : 'Entidad'}
                />
              </div>
              <div className="space-y-1.5">
                {i === 0 && <label htmlFor={`monto-${p.id}`} className="text-sm font-semibold">Monto en esa entidad (COP)</label>}
                <input
                  id={`monto-${p.id}`}
                  type="number"
                  min="0"
                  step="1000"
                  className="glass-input"
                  value={p.monto}
                  onChange={e => cambiarFila(p.id, 'monto', e.target.value)}
                  placeholder="Ej: 60000000"
                  aria-label={i === 0 ? undefined : 'Monto en esa entidad (COP)'}
                />
              </div>
              <button
                type="button"
                onClick={() => eliminarFila(p.id)}
                disabled={posiciones.length === 1}
                aria-label={`Eliminar fila de ${p.entidad || 'entidad'}`}
                className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Eliminar
              </button>
            </div>
          ))}

          <button type="button" onClick={agregarFila} className="btn-secondary">
            + Agregar otra entidad
          </button>
        </div>
      </section>

      {resultado && (
        <section className="glass-card p-6 md:p-8 space-y-4">
          <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100">Cobertura por entidad</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Cobertura de Fogafín por entidad financiera</caption>
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className="py-2 pr-4">Entidad</th>
                  <th scope="col" className="py-2 px-4">Invertido</th>
                  <th scope="col" className="py-2 px-4">Cubierto</th>
                  <th scope="col" className="py-2 pl-4">Sin cobertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {resultado.porEntidad.map(e => (
                  <tr key={e.entidad}>
                    <td className="py-2 pr-4">{e.entidad}</td>
                    <td className="py-2 px-4 tabular-nums">{formatCurrency(e.monto)}</td>
                    <td className="py-2 px-4 tabular-nums">{formatCurrency(e.cubierto)}</td>
                    <td className={`py-2 pl-4 tabular-nums ${e.descubierto > 0 ? 'font-semibold text-orange-700 dark:text-orange-400' : ''}`}>
                      {formatCurrency(e.descubierto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {resultado.totalDescubierto > 0 ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">⚠️</span>
              <div>
                <p className="text-orange-900 dark:text-orange-200 font-semibold text-lg">
                  Tienes {formatCurrency(resultado.totalDescubierto)} sin cobertura de Fogafín
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                  Con {formatCurrency(resultado.totalInvertido)} en total, necesitarías repartir tu plata en al menos{' '}
                  {entidadesSugeridas} entidades distintas (con máximo {formatCurrency(coberturaMaxima)} en cada una)
                  para que todo quede cubierto.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">✅</span>
              <p className="text-sm text-green-800 dark:text-green-300">
                Todo lo que listaste queda cubierto por el seguro de depósitos en cada entidad.
              </p>
            </div>
          )}
        </section>
      )}

      <section className="glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => setAjustarAbierto(a => !a)}
          aria-expanded={ajustarAbierto}
          aria-controls="ajustar-fogafin"
          className="w-full flex items-center justify-between gap-4 p-5 md:px-8 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div className="min-w-0">
            <h3 className="text-base font-bold text-primary-900 dark:text-primary-100">Supuesto legal usado</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Cobertura máxima: {formatCurrency(coberturaMaxima)} por entidad</p>
          </div>
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400 shrink-0">{ajustarAbierto ? 'Ocultar' : 'Ajustar'}</span>
        </button>

        {ajustarAbierto && (
          <div id="ajustar-fogafin" className="px-5 md:px-8 pb-6 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fogafín revisa este monto cada 3 años. Si publica un valor nuevo, ajustalo acá para simular el escenario.
            </p>
            <div className="max-w-xs">
              <Campo etiqueta="Cobertura máxima por entidad (COP)" htmlFor="cobertura-fogafin">
                <input id="cobertura-fogafin" type="number" min="0" step="1000000" className="glass-input" value={coberturaMaxima}
                  onChange={e => setCoberturaMaxima(parseFloat(e.target.value) || 0)} />
              </Campo>
            </div>
          </div>
        )}
      </section>

      <section className="glass-card p-6 md:p-8">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Fuente: {FUENTE_FOGAFIN} Esta herramienta informa y compara; nunca sugiere una entidad puntual, solo cuántas
          hacen falta para quedar cubierto. Confirma siempre las condiciones vigentes con Fogafín o tu entidad.
        </p>
      </section>
    </div>
  );
}
