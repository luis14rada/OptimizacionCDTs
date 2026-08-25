# Pendientes — Optimizador de CDTs

Estado a 24 de agosto de 2026. Salió de una auditoría del código y de dos
investigaciones sobre el mercado colombiano. La versión con el detalle completo
de cada propuesta está en el documento de ruta compartido aparte.

**Ya desplegado en producción** (commit `05a5f5a`): los tres errores de cálculo,
los parámetros configurables, la persistencia, la comparación de escenarios A/B,
la carga inicial reducida de 877 KB a 263 KB, la tipografía Inter, el focus trap
del modal de aviso legal, las pruebas de `pdfExport.js` y `PortfolioChart.jsx`,
el bug del SMMLV fijo en el gráfico que no seguía el año gravable seleccionado,
la tabla accesible equivalente al gráfico de flujo mensual, el Error Boundary,
el reporte de cobertura con umbral mínimo en el CI (ver hallazgo sobre
`App.jsx` y `useTheme.js` más abajo, en "Hallazgo sin decidir"), las cabeceras
de seguridad, Vercel Analytics (falta que actives "Web Analytics" en el
dashboard del proyecto en Vercel — sin ese paso tuyo no se recolecta nada),
poder editar un CDT existente (botón "Editar" junto a "Eliminar", con
"Cancelar edición" para descartar cambios a medias), y la pantalla vacía con
un botón «Ver un caso de ejemplo» que carga dos CDTs elegidos a propósito
para mostrar de entrada el hallazgo central de la app: cada uno por separado
no llega al tope de 1 SMMLV, pero sus intereses del mismo mes combinados sí
lo superan. Suite en 97 pruebas.

**Resuelto y verificado, en PR pendiente de merge**: favicon nuevo —
"barras en alza" (opción B de las cuatro propuestas), mismo gradiente
azul→índigo que ya usa el encabezado de la app, coherente con
`og-image.png`. Bajó de 9.522 a 709 bytes; el diseño anterior era el rayo
morado sin editar de la plantilla de Vite.

**Auditado el 24 de agosto de 2026, sin cambios de código necesarios**:
contraste de color en modo oscuro. Se midieron las 13 combinaciones de texto
sobre fondo translúcido del proyecto (`bg-orange-900/30` y similares en
`CDTSimulator.jsx` y `ComparadorEscenarios.jsx`), calculando el color
compuesto real (paleta OKLCH de Tailwind v4 convertida a sRGB, con
compositing de las capas de opacidad correspondientes: `glass-card` sobre el
gradiente del body, y el fondo de color sobre eso) contra el criterio WCAG AA
de 4.5:1. **Las 13 pasan**, con el caso más ajustado en 5.52:1 (la celda de
totales de "Seg. Social", `text-orange-400` sobre `bg-orange-900/40`) y el
resto entre 6.78:1 y 15.67:1. Verificado también a simple vista en el
navegador en modo oscuro. El script de medición (Node.js, sin dependencias)
no quedó en el repo por ser una comprobación puntual, no una guardia
automática — si se agregan combinaciones de color nuevas, hay que volver a
medir a mano.

---

## Orden de prioridad

Reordenado el 24 de agosto de 2026 a pedido de Luis. El criterio: lo que puede
producir una cifra equivocada o dejar a alguien sin acceso va antes que lo
cosmético. Se trabaja de arriba hacia abajo, cerrando y verificando cada punto
antes de pasar al siguiente.

*Sin puntos activos.* Los nueve del reordenamiento del 24 de agosto de 2026
quedaron todos resueltos — el favicon (arriba) era el último. Los dos
hallazgos sin decidir (`App.jsx`/`useTheme.js` sin pruebas, más abajo) y los
dos puntos en pausa a pedido de Luis siguen fuera del flujo activo hasta
nueva indicación.

---

## Hacia dónde puede crecer — nuevas pestañas

**Con el reordenamiento cerrado, esta es la sección activa siguiente.** Doce propuestas
priorizadas por dolor documentado × facilidad de cálculo × frecuencia. Cada una
salió de investigar cifras reales del mercado colombiano, no de intuición — por
eso el orden interno de esta tabla no se tocó al reordenar el resto del backlog.

**El hallazgo que ordena la lista:** la app resuelve un problema real pero de nicho.
En el mismo mes, las cuentas de ahorro colombianas rinden entre **0,07% y 10% anual**
— 143 veces de diferencia con el mismo riesgo y la misma liquidez. Con la inflación en
6,03%, quien tiene $10 millones en la cuenta equivocada pierde **$572.000 de poder
adquisitivo al año** sin enterarse. Y el 82,4% de los adultos tiene cuenta de ahorros,
contra el 1–2% que invierte en bolsa.

| # | Pestaña | Dolor que resuelve |
|---|---|---|
| 1 | ¿Cuánto te cuesta tu cuenta de ahorros? | 143× de diferencia entre la peor y la mejor cuenta |
| 2 | Rentabilidad real: la cadena completa | La ganancia real es menos de la mitad de la nominal |
| 3 | Calculadora UGPP con presunción de costos | 8,3 M de trabajadores por cuenta propia; deducción de 27,5%–82,3% que casi nadie usa |
| 4 | ¿Me toca declarar renta? | Sanción mínima de $523.740 aunque declares un día tarde |
| 5 | 4×1000: cuánto pagas y cómo dejar de pagarlo | $240.000/año evitables con un solo trámite |
| 6 | Escalera de CDTs y cobertura Fogafín | El seguro cubre $50 M por entidad; nadie ayuda a repartir |
| 7 | Qué hacer con la prima y las cesantías | 79% se arrepiente de cómo gastó su prima |
| 8 | El costo real de tu deuda | Usura al 29,66%; gota a gota al 382% |
| 9 | Detector de pirámides | 262.000 víctimas, $4,2 billones perdidos |
| 10 | Costo total de tener una cuenta | Cuota de manejo de $0 a $44.030/mes |
| 11 | Fondo de emergencia | Solo 1 de cada 5 cubre un imprevisto |
| 12 | Herencias y ganancia ocasional | Exenciones mal aplicadas de $85 M a $680 M |

**Recomendación (cuando llegue el momento):** la propuesta 1 como siguiente
pestaña. Mayor dolor documentado, la más fácil de calcular, y abre la puerta a un
público cien veces más grande.

### Límites que aplican a todas

- **Informar y comparar es libre; recomendar es actividad regulada.** Mostrar tasas
  públicas y calcular con ellas es informar. Decirle a alguien qué hacer con su plata
  entra en terreno de asesoría vigilada por la Superfinanciera.
- Nunca nombrar una entidad como «la mejor»: mostrar el ordenamiento y el criterio.
- **Todo dato de mercado necesita fecha de corte visible.** La tasa de usura pasó de
  24,36% a 29,66% en ocho meses de 2026. Un dato de hace tres meses ya es ruido, y
  publicarlo sin fechar es lo más cerca que estaría el proyecto de inducir a error.
- Cada pestaña que toque tributación o deuda necesita su descargo específico, además
  del general.

> Las cifras de esta sección tienen fecha de corte entre julio y agosto de 2026 y
> provienen de fuentes públicas colombianas. La investigación del marco legal quedó
> incompleta: trátese como orientación, no como concepto jurídico.

---

## Hallazgo sin decidir

Encontrado el 24 de agosto de 2026 al configurar el reporte de cobertura
(`vite.config.js`, punto resuelto arriba). No es algo que Luis haya pedido
posponer — queda documentado para decidir si se agrega como punto activo.

### `App.jsx` y `src/hooks/useTheme.js` sin ninguna prueba
Con `coverage.all: true` (para que un archivo sin pruebas cuente como 0% en
vez de desaparecer del cálculo), ambos quedan en **0%** de cobertura. `App.jsx`
tiene lógica real (el estado del aviso legal aceptado); `useTheme.js` maneja
la persistencia del tema claro/oscuro. Ninguno de los dos tiene un archivo
`.test.jsx`/`.test.js` hoy.

---

## En pausa — no tocar salvo que se pida explícitamente

Bajados de prioridad el 24 de agosto de 2026 a pedido de Luis. Se quedan aquí
documentados pero fuera del flujo de trabajo activo hasta nueva indicación.

### Validar los valores por defecto con un contador
No es tarea de código. Los parámetros del panel (`src/parametros.js`) ya son
configurables, lo que bajó mucho el riesgo, pero **el valor que traen por defecto
sigue siendo una afirmación frente a quien use la app**. Dos puntos concretos que
quedaron sin confirmar con fuente oficial:

- ¿La retención en la fuente sobre rendimientos financieros es 4% para declarantes
  y 7% para no declarantes?
- El modelo de situación laboral (quién aporta salud, quién pensión, y cuándo deja
  de aplicar el piso de 1 SMMLV) es una simplificación. Ver la tabla en el README.

### Sin actualización automática de dependencias
Dependabot o Renovate abren PRs cuando salen parches de seguridad. Con el CI ya
montado, cada PR se valida solo.
