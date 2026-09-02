import React, { useState } from 'react';
import { calcularGMFTransaccion, calcularAhorroPorMarcarCuenta, calcularMaximoTransferible } from '../GMFEngine';
import { TARIFA_GMF, TOPE_EXENTO_MENSUAL_UVT, UVT_GMF, FUENTE_GMF } from '../parametrosGMF';
import Campo from './Campo';

const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
const formatPorcentajeGMF = (tarifa) => `${(tarifa * 1000).toFixed(0)}x1000`;

export default function CalculadoraGMF() {
  const [monto, setMonto] = useState('');
  const [cuentaMarcada, setCuentaMarcada] = useState(false);
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [supuestos, setSupuestos] = useState({ tarifa: TARIFA_GMF, topeExentoUvt: TOPE_EXENTO_MENSUAL_UVT, uvt: UVT_GMF });
  const [ajustarAbierto, setAjustarAbierto] = useState(false);

  const cambiarSupuesto = (clave, v) => setSupuestos(prev => ({ ...prev, [clave]: v }));

  const montoNum = parseFloat(monto) || 0;
  const hayMonto = montoNum > 0;

  const actual = hayMonto ? calcularGMFTransaccion({ montoTransaccion: montoNum, cuentaMarcada, ...supuestos }) : null;
  const comparacion = hayMonto ? calcularAhorroPorMarcarCuenta({ montoTransaccion: montoNum, ...supuestos }) : null;
  // El mismo monto, leído al revés: si eso es todo el saldo, ¿cuánto se puede mover?
  const maximo = hayMonto ? calcularMaximoTransferible({ saldoDisponible: montoNum, cuentaMarcada, ...supuestos }) : null;

  return (
    <div className="space-y-8">
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary-900 dark:text-primary-100">4×1000: cuánto pagas y cómo dejar de pagarlo</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            El Gravamen a los Movimientos Financieros ({formatPorcentajeGMF(supuestos.tarifa)}) se cobra sobre cada retiro
            o pago que haces desde tus cuentas. Marcar una cuenta como exenta ante tu banco te libra de pagarlo sobre los
            primeros {supuestos.topeExentoUvt} UVT que muevas cada mes en esa cuenta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="monto-transaccion" className="text-sm font-semibold">Monto de esta transacción (retiro o pago)</label>
            <input
              id="monto-transaccion"
              type="number"
              min="0"
              step="10000"
              className="glass-input"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="Ej: 500000"
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold block">¿Esa cuenta ya está marcada como exenta?</span>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="cuenta-marcada" checked={cuentaMarcada === true} onChange={() => setCuentaMarcada(true)} />
                Sí
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="cuenta-marcada" checked={cuentaMarcada === false} onChange={() => setCuentaMarcada(false)} />
                No
              </label>
            </div>
          </div>
        </div>
      </section>

      {actual && comparacion && (
        <section className="glass-card p-6 md:p-8 space-y-4">
          <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100">GMF de esta transacción</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Pagas en esta transacción ({cuentaMarcada ? 'cuenta marcada' : 'sin marcar'})</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(actual.gmfTransaccion)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sobre {formatCurrency(montoNum)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400">Tope exento mensual (una cuenta marcada)</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(comparacion.topeExento)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{supuestos.topeExentoUvt} UVT</p>
            </div>
          </div>

          {!cuentaMarcada && comparacion.ahorroTransaccion > 0 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">⚠️</span>
              <div>
                <p className="text-orange-900 dark:text-orange-200 font-semibold text-lg">Podrías ahorrarte {formatCurrency(comparacion.ahorroTransaccion)} en esta transacción</p>
                <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                  Pídele a tu banco que marque una cuenta como exenta de GMF -- normalmente es un trámite gratuito y
                  rápido. Aunque la ley ordenó automatizar esta exención entre todas tus cuentas desde diciembre de
                  2024, esa automatización todavía no está plenamente implementada: en la práctica, sigues necesitando
                  marcar la cuenta tú mismo.
                </p>
              </div>
            </div>
          )}

          {cuentaMarcada && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex gap-3 items-start">
              <span className="text-xl" aria-hidden="true">✅</span>
              <p className="text-sm text-green-800 dark:text-green-300">
                Ya aprovechas la exención. {comparacion.gmfTransaccionMarcada > 0
                  ? `Como esta transacción supera el tope mensual, igual pagas GMF sobre el excedente: ${formatCurrency(comparacion.gmfTransaccionMarcada)}.`
                  : 'Si esta es tu única transacción del mes en esta cuenta, no pagas GMF.'}
                {' '}El tope es acumulado por mes: si ya moviste plata antes en esta cuenta este mes, el resultado real
                puede ser distinto.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-base font-bold text-primary-900 dark:text-primary-100">
              Si esos {formatCurrency(montoNum)} son todo lo que tienes en la cuenta
            </h4>

            {maximo.gmfTransaccion > 0 ? (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  El banco te debita el monto <strong>y además</strong> el {formatPorcentajeGMF(supuestos.tarifa)}, así que
                  el saldo tiene que alcanzar para los dos: no puedes transferir todo. Lo máximo que puedes mover de una
                  sola vez es:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-slate-500 dark:text-slate-400">Máximo que puedes transferir</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(maximo.montoTransferible)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-slate-500 dark:text-slate-400">Lo que se lleva el {formatPorcentajeGMF(supuestos.tarifa)}</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(maximo.gmfTransaccion)}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Puedes transferir los {formatCurrency(montoNum)} completos: con la cuenta marcada como exenta esta
                transacción no paga {formatPorcentajeGMF(supuestos.tarifa)}, así que no necesitas dejar nada en la cuenta
                para cubrir el impuesto.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={esRecurrente} onChange={e => setEsRecurrente(e.target.checked)} />
              ¿Vas a repetir este mismo movimiento todos los meses?
            </label>

            {esRecurrente && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Si lo repites todos los meses, en un año pagarías {formatCurrency(cuentaMarcada ? comparacion.gmfAnualMarcada : comparacion.gmfAnualSinMarcar)}{' '}
                ({formatCurrency(actual.gmfTransaccion)}/mes) -- es una proyección, no una obligación: si dejas de hacer
                la transacción, ese costo tampoco se sostiene.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="glass-card overflow-hidden">
        <button
          type="button"
          onClick={() => setAjustarAbierto(a => !a)}
          aria-expanded={ajustarAbierto}
          aria-controls="ajustar-gmf"
          className="w-full flex items-center justify-between gap-4 p-5 md:px-8 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div className="min-w-0">
            <h3 className="text-base font-bold text-primary-900 dark:text-primary-100">Supuestos legales usados</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Tarifa {formatPorcentajeGMF(supuestos.tarifa)} · Tope {supuestos.topeExentoUvt} UVT</p>
          </div>
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400 shrink-0">{ajustarAbierto ? 'Ocultar' : 'Ajustar'}</span>
        </button>

        {ajustarAbierto && (
          <div id="ajustar-gmf" className="px-5 md:px-8 pb-6 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Si el Congreso cambia la tarifa o el tope exento, ajustalos acá para simular el escenario -- por defecto
              vienen con los valores oficiales vigentes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Campo etiqueta="Tarifa GMF" ayuda="0,004 = 4x1000" htmlFor="tarifa-gmf">
                <input id="tarifa-gmf" type="number" step="0.0001" className="glass-input" value={supuestos.tarifa}
                  onChange={e => cambiarSupuesto('tarifa', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="Tope exento mensual (UVT)" htmlFor="tope-gmf">
                <input id="tope-gmf" type="number" className="glass-input" value={supuestos.topeExentoUvt}
                  onChange={e => cambiarSupuesto('topeExentoUvt', parseFloat(e.target.value) || 0)} />
              </Campo>
              <Campo etiqueta="UVT vigente" htmlFor="uvt-gmf">
                <input id="uvt-gmf" type="number" className="glass-input" value={supuestos.uvt}
                  onChange={e => cambiarSupuesto('uvt', parseFloat(e.target.value) || 0)} />
              </Campo>
            </div>
          </div>
        )}
      </section>

      <section className="glass-card p-6 md:p-8">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Fuente: {FUENTE_GMF} Esta herramienta informa y compara; no es asesoría tributaria. Confirma siempre con tu
          banco si tu cuenta ya está marcada como exenta.
        </p>
      </section>
    </div>
  );
}
