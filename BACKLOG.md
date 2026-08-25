# Pendientes — Optimizador de CDTs

Estado a 24 de agosto de 2026. Salió de una auditoría del código y de dos
investigaciones sobre el mercado colombiano. La versión con el detalle completo
de cada propuesta está en el documento de ruta compartido aparte.

**Ya desplegado en producción** (commit `48cea9b`): los tres errores de cálculo,
los parámetros configurables, la persistencia, la comparación de escenarios A/B,
la carga inicial reducida de 877 KB a 263 KB, la tipografía Inter, el focus trap
del modal de aviso legal, las pruebas de `pdfExport.js` y `PortfolioChart.jsx`,
el bug del SMMLV fijo en el gráfico que no seguía el año gravable seleccionado,
la tabla accesible equivalente al gráfico de flujo mensual, el Error Boundary,
el reporte de cobertura con umbral mínimo en el CI (ver hallazgo sobre
`App.jsx` y `useTheme.js` más abajo, en "En pausa"), las cabeceras de
seguridad, Vercel Analytics (falta que actives
"Web Analytics" en el dashboard del proyecto en Vercel — sin ese paso tuyo
no se recolecta nada), poder editar un CDT existente, la pantalla vacía con
un botón «Ver un caso de ejemplo», y el favicon nuevo ("barras en alza",
coherente con `og-image.png`). Con esto, los nueve puntos del reordenamiento
del 24 de agosto quedan todos resueltos.

Sobre esa base, ya desplegadas también las dos primeras pestañas nuevas y el
rebrand que las acompaña:

- **Pestaña 1 — "¿Cuánto te cuesta tu cuenta de ahorros?".** Compara tu cuenta
  contra otras 9 entidades (o una tasa que ingreses a mano) y calcula el
  retorno real descontando inflación (ecuación de Fisher). Datos reales:
  tasas de la Superintendencia Financiera (corte 17 de junio de 2026) e
  inflación del IPC de julio de 2026 (DANE), en `src/tasasAhorro.js` con su
  fuente y fecha. Define el patrón de pestañas para el resto de la lista.
  Efecto de paso: `App.jsx` y `useTheme.js` (el hallazgo en pausa, más abajo)
  ya tienen cobertura real vía `App.test.jsx`, aunque el hallazgo sigue en
  pausa hasta que Luis lo reactive.
- **Rebrand a "Optimizador Financiero".** La app dejó de ser solo de CDTs.
  Título, meta tags (Open Graph/Twitter) y `og-image.png` actualizados; el
  `<h1>` del encabezado ahora cambia según la pestaña activa (el contenido de
  "Optimizador de CDTs" no se borró, solo dejó de ser el único título fijo).
  Se investigó automatizar la actualización mensual de `tasasAhorro.js` con
  una GitHub Action: sin fuente confiable y automatizable (los 3 datasets de
  tasas de captación en datos.gov.co están vacíos pese a responder HTTP 200,
  y la página oficial de la Superfinanciera requiere simular un postback JSF
  con tokens de ViewState) — queda descartada por ahora, con actualización
  manual anual.
- **Pestaña 2 — "Rentabilidad real: la cadena completa".** De la tasa nominal
  de cualquier producto (CDT, fondo, cuenta) hasta lo que realmente queda:
  nominal → menos retención en la fuente → menos inflación = retorno real.
  Reutiliza datos ya sourceados (retención de `parametros.js`, inflación de
  `tasasAhorro.js`) en vez de investigar de nuevo. Con los valores por
  defecto (10% nominal, retención 4%), solo sobrevive el 33,67% en términos
  reales — confirma el dolor que documentaba esta sección del backlog.

Suite en 125 pruebas.

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
quedaron todos resueltos — el favicon fue el último.

---

## Hacia dónde puede crecer — nuevas pestañas

**Propuestas 1 a 5, 7, 9 y 10 resueltas y desplegadas — ver arriba.** El hallazgo
de `App.jsx`/`useTheme.js` sin pruebas (sección "En pausa" más abajo) sigue
pospuesto hasta que Luis decida cerrarlo del todo. Doce propuestas
priorizadas por dolor documentado × facilidad de cálculo × frecuencia. Cada una
salió de investigar cifras reales del mercado colombiano, no de intuición.

**Orden de trabajo del 25 de agosto de 2026, a pedido explícito de Luis**: eligió
resolver la 7, luego la 9 y luego la 10, **saltándose deliberadamente la 6 y la 8** --
no es que estén descartadas, solo no les tocó el turno todavía.

**Reordenado el 25 de agosto de 2026 a pedido de Luis**: la propuesta "Calculadora
UGPP con presunción de costos" pasó del puesto 3 al final de la lista y queda **fuera
del flujo de trabajo activo** hasta que se pida explícitamente retomarla -- no se
desarrolla por ahora. El resto de la tabla conserva su orden original.

**El hallazgo que ordenó la lista originalmente:** la app resuelve un problema real
pero de nicho. En el mismo mes, las cuentas de ahorro colombianas rinden entre
**0,07% y 10% anual** — 143 veces de diferencia con el mismo riesgo y la misma
liquidez. Con la inflación en 6,03%, quien tiene $10 millones en la cuenta equivocada
pierde **$572.000 de poder adquisitivo al año** sin enterarse. Y el 82,4% de los
adultos tiene cuenta de ahorros, contra el 1–2% que invierte en bolsa.

| # | Pestaña | Dolor que resuelve |
|---|---|---|
| 1 | ¿Cuánto te cuesta tu cuenta de ahorros? **(resuelto)** | 143× de diferencia entre la peor y la mejor cuenta |
| 2 | Rentabilidad real: la cadena completa **(resuelto)** | La ganancia real es menos de la mitad de la nominal |
| 3 | ¿Me toca declarar renta? **(resuelto)** | Sanción mínima de $523.740 aunque declares un día tarde |
| 4 | 4×1000: cuánto pagas y cómo dejar de pagarlo **(resuelto)** | $240.000/año evitables con un solo trámite |
| 5 | Escalera de CDTs y cobertura Fogafín **(resuelto)** | El seguro cubre $50 M por entidad; nadie ayuda a repartir |
| 6 | Qué hacer con la prima y las cesantías | 79% se arrepiente de cómo gastó su prima |
| 7 | El costo real de tu deuda **(resuelto)** | Usura al 29,66%; gota a gota al 382% |
| 8 | Detector de pirámides | 262.000 víctimas, $4,2 billones perdidos |
| 9 | Costo total de tener una cuenta **(resuelto)** | Cuota de manejo de $0 a $44.030/mes |
| 10 | Fondo de emergencia **(resuelto)** | Solo 1 de cada 5 cubre un imprevisto |
| 11 | Herencias y ganancia ocasional | Exenciones mal aplicadas de $85 M a $680 M |
| 12 | Calculadora UGPP con presunción de costos **(en pausa, no desarrollar salvo pedido explícito)** | 8,3 M de trabajadores por cuenta propia; deducción de 27,5%–82,3% que casi nadie usa |

**Propuestas 1 a 5, 7, 9 y 10 ya resueltas** (ver arriba; cada bloque se resolvió
en bundle, ver las notas de investigación legal más abajo). Quedan pendientes 6, 8,
11 y 12 (esta última en pausa) -- ninguna tiene prioridad fija hasta que Luis la pida.

**Nota de investigación de la propuesta 1, por si sirve para las siguientes:** de
las tasas de ahorro investigadas, solo quedaron en `src/tasasAhorro.js` las 10
entidades con cifra exacta de la misma fuente (Superfinanciera) y fecha de corte.
BBVA y Davivienda quedaron afuera a propósito: lo único que se encontró de esos
bancos fue la tasa promocional de un producto puntual, no el promedio comparable
con el resto — mezclar esas dos metodologías habría hecho la tabla engañosa. Si
alguna propuesta futura necesita datos de mercado, vale la pena aplicar el mismo
criterio: una sola fuente, una sola metodología, por tabla.

**Nota de investigación legal de las propuestas 3, 4 y 5 (25 de agosto de 2026):**
cada pestaña cita su norma exacta y usa parámetros configurables (patrón
`CONSTANTES_POR_ANIO` de `src/parametros.js`), para poder simular si la ley cambia.

- **¿Me toca declarar renta?**: los 5 topes del art. 592-593 ET (reglamentado por
  el Decreto 1625 de 2016), evaluados con la UVT 2025 ($49.799, Resolución DIAN
  000193 de 2024) por ser el año gravable que se declara en 2026. La sanción mínima
  (art. 639 ET, 10 UVT) usa la UVT 2026 ($52.374, Resolución DIAN 000238 de 2025) por
  ser el año en que se presenta -- de ahí sale exacto el $523.740 que ya citaba esta
  tabla.
- **4×1000**: tarifa permanente desde la Ley 1819 de 2016 (art. 872 ET) -- esa ley
  derogó el cronograma de desmonte gradual que había fijado la Ley 1739 de 2014 (que
  preveía llegar a 0% en 2022). Varias fuentes online, **incluida una página de la
  propia DIAN**, todavía reproducen ese cronograma viejo como si estuviera vigente;
  se verificó cruzando varias fuentes independientes fechadas en 2026 que la tarifa
  sigue siendo 4x1000. La exención de 350 UVT/mes en una cuenta marcada (art. 879
  numeral 1 ET) sigue exigiendo el trámite manual con el banco en 2026: la
  automatización entre todas las cuentas de una persona que ordenó la Ley 2277 de
  2022 (art. 881-1 ET) desde el 13 de diciembre de 2024 todavía no está plenamente
  implementada.
- **Escalera de CDTs y cobertura Fogafín**: $50.000.000 por depositante, por entidad,
  fijados por la Resolución 002 de 2017 de la Junta Directiva de Fogafín (subió de
  $20.000.000, vigente desde abril de 2017). Esa resolución adoptó una revisión cada
  3 años basada en inflación -- no se encontró evidencia de un cambio de monto desde
  entonces (fuentes verificadas hasta junio de 2026), pero como la política de
  revisión existe, vale la pena reconfirmar el monto cada cierto tiempo.

**Nota de investigación legal de las propuestas 7, 9 y 10 (25 de agosto de 2026):**

- **El costo real de tu deuda**: la tasa de usura es 1,5x el Interés Bancario
  Corriente (IBC, art. 884 Código de Comercio) -- con el IBC de agosto de 2026
  (19,77%, Resolución 1139 de 2026 de la Superfinanciera) da 29,65% E.A., coherente
  con el 29,66% que ya citaba esta tabla. Cobrar por encima es el delito de usura
  (art. 305 Código Penal, pena de 32 a 90 meses); si TRIPLICA el IBC, la pena
  aumenta. **A diferencia del resto de constantes legales del proyecto, el IBC
  cambia todos los meses, no una vez al año** -- por eso la pestaña deja la fecha
  de corte bien visible y el valor totalmente editable. El 382,2% del "gota a
  gota" es un estimado de mercado de ANIF y Colombia Fintech (La República, 23 de
  enero de 2025), no una tasa oficial -- es más viejo que el resto de los datos de
  este bloque, se trata como orden de magnitud.
- **Costo total de tener una cuenta**: cuotas de manejo de la actualización
  trimestral de productos de depósito de la Superfinanciera, corte 1 de julio de
  2026 (vía La República). **Es una referencia parcial, no exhaustiva**: el reporte
  cubre 25 bancos, pero las notas de prensa disponibles solo desglosaron las 9
  entidades con cobro en cuenta y las 7 con cobro en tarjeta débito, no las que
  cobran $0 -- si tu banco no aparece en la tabla, puede que no cobre nada, pero no
  es un dato confirmado.
- **Fondo de emergencia**: a diferencia de las otras dos, **no hay una norma
  colombiana** que fije cuánto ahorrar -- los 3 a 6 meses de gastos son una
  práctica de planeación financiera estándar, no una ley. La estadística de que
  solo 1 de cada 5 colombianos podría cubrir un imprevisto es de Banco W (15 de
  julio de 2026), coherente con el dato que ya citaba esta tabla.

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

## En pausa — no tocar salvo que se pida explícitamente

Bajados de prioridad a pedido de Luis. Se quedan aquí documentados pero fuera
del flujo de trabajo activo hasta nueva indicación.

### `App.jsx` y `src/hooks/useTheme.js` sin pruebas dedicadas
Encontrado el 24 de agosto de 2026 al configurar el reporte de cobertura:
ambos estaban en **0%**, sin ningún archivo `.test.jsx`/`.test.js`. Al armar
`App.test.jsx` para las pestañas (más arriba), `App.jsx` quedó en **100%** de
cobertura y `useTheme.js` en **80%** como efecto de paso — pero fue
incidental, cubre lo que ese test necesitaba ejercitar para las pestañas, no
un análisis dedicado de `useTheme.js` (persistencia del tema, detección de
preferencia del sistema, etc.). Sigue en pausa desde el 24 de agosto de 2026
hasta que Luis pida cerrarlo del todo.

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
