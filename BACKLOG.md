# Pendientes — Optimizador de CDTs

Estado a 4 de septiembre de 2026. Salió de una auditoría del código y de dos
investigaciones sobre el mercado colombiano. La versión con el detalle completo
de cada propuesta está en el documento de ruta compartido aparte.

**Ya desplegado en producción** (commit `b3e9b65`): los tres errores de cálculo,
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

Después de eso, ya desplegadas también las pestañas 3 a 5 y 7, 9 y 10 (ver la
tabla de "Hacia dónde puede crecer" más abajo para el detalle de cada una), y
dos cambios transversales:

- **SEO — URL propia por herramienta.** Antes las 9 pestañas vivían todas en
  la misma dirección (`https://optimizacioncdts.vercel.app/`), cambiando por
  estado de React -- Google no tenía nada específico que indexar para, por
  ejemplo, "calculadora 4x1000". Se agregó `react-router-dom`: cada pestaña
  tiene ahora su propia URL (`/calculadora-4x1000`, `/tasa-de-usura`, etc.),
  su propio `<title>`/meta description/canonical (`useDocumentMeta.js`) y su
  bloque JSON-LD (`SoftwareApplication`, sin inventar rating). `src/rutas.js`
  es la fuente única de verdad para el routing, los meta tags y el
  `sitemap.xml` (se regenera en cada build, no vive en git). Se agregó
  `robots.txt` y la barra de pestañas pasó de `role="tablist"` al patrón de
  navegación real (`<nav>`/`<Link>`/`aria-current`), correcto ahora que cada
  una es una página de verdad. **26 de agosto de 2026: Luis verificó el
  dominio en Google Search Console y envió el sitemap** -- el único paso de
  todo esto que no podía hacer código, ya está cerrado.
- Corrección de un error de diseño en la calculadora de 4×1000: el resultado
  principal pasó de una proyección mensual/anual (que asumía que la persona
  iba a repetir la transacción todos los meses, algo que no se puede
  garantizar) al costo de la transacción puntual que se ingresa, con la
  proyección mensual/anual como dato secundario y opcional. De paso, se
  corrigió voseo ("pagás", "pedile", "vos") a tuteo colombiano en toda la
  interfaz -- se había colado en todo lo escrito en las últimas rondas.

Suite en 202 pruebas.

Después de eso, una ronda sobre la pestaña de CDTs que empezó como una mejora
visual y terminó destapando tres errores de cálculo o de lectura:

- **Flujo mensual desagregado por CDT.** La barra de cada mes se parte en un
  segmento por CDT. El motor ya sabía qué CDT aportó cada pago, pero al
  construir `flujoMensual` lo colapsaba al total y esa información se perdía.
  El desglose se identifica sin depender del color: leyenda con el nombre de
  cada CDT (numerando los del mismo banco), el nombre dentro del segmento
  cuando cabe, el tooltip, y una columna nueva en la tabla accesible.
- **El tope máximo de inversión mentía en dos escenarios.** Ignoraba la
  situación laboral (a quien ya cotizaba le daba el número del rentista y al
  agregarlo la simulación cobraba $199.603 al mes) e ignoraba el portafolio
  actual (el umbral es del mes, así que sumado a CDTs que ya pagaban ahí se
  pasaba: $499.008 al mes en el caso probado). Ahora descuenta lo que el
  portafolio ya recibe en su mes más cargado y devuelve `null` cuando no
  existe tope, con la interfaz diciéndolo en vez de dar un número falso.
- **El umbral de 1 SMMLV también aplica a quien ya tiene salario.** Era el
  supuesto de más consecuencia para el usuario al que apunta la app —un
  empleado que además tiene CDTs— y el motor le cobraba desde el primer peso.
  El art. 89 de la Ley 2277 de 2022 no condiciona el umbral a tener vínculo
  laboral, y el ABC de la UGPP trata como independiente a quien, teniendo
  salario, percibe además otros ingresos. Queda configurable
  (`umbralAplicaConSalario`, por defecto `true`) con las fuentes enlazadas.
  El arreglo de fondo fue separar dos cosas que una sola bandera decidía:
  `aplicaPisoIbc` responde "¿sobre qué base mínima?" y `exigeUmbralDeCapital()`
  responde "¿debo cotizar?".
- **La línea de referencia de la gráfica estaba mal dos veces.** Se dibujaba
  en el SMMLV ($1.750.905) sobre un eje que es interés bruto, cuando el umbral
  en bruto es $2.415.041 — un 38% a la izquierda de donde nace la obligación.
  Y su porcentaje se medía contra el ancho de toda la fila en vez de contra la
  franja de las barras, así que terminaba dibujada encima de la columna de los
  montos. Los dos defectos se tapaban entre sí: al corregir el valor, la línea
  se fue al extremo derecho y el desalineamiento quedó en evidencia.
- **Cada mes cercano al límite dice por cuánto se pasa o cuánto le falta.**
  Salió de un caso real de Luis: dos meses que en pantalla se ven casi iguales,
  uno paga $199.603 al año y el otro no. La diferencia eran **11 centavos**.
  Las cifras se muestran con centavos cuando son menores a $100, porque
  redondeadas a pesos el resultado seguía pareciendo arbitrario.

De paso, la situación laboral por defecto pasó de "rentista de capital" a
"empleado" (la más común de quien abre un CDT) y el campo del IBC explica qué
valor va: la base de salud y pensión del desprendible de nómina, sin auxilio de
transporte ni prestaciones, o el 70% si el salario es integral. También se
corrigieron dos desbordamientos horizontales en móvil que ya existían.

Suite en 247 pruebas. Cobertura al 4 de septiembre de 2026: 90,56% statements,
78,65% branches, 80,98% functions, 91,75% lines.

**Pendiente de decisión de Luis**, anotado y sin tocar:

- El subtítulo de la app todavía le habla al "rentista de capital", y es
  también la meta description que ve Google (`src/rutas.js`). Con "empleado"
  como situación por defecto, ya no describe al usuario típico. Cambiarlo
  afecta SEO, así que no se hizo por cuenta propia.
- Una fuente secundaria (Gerencie) menciona costos presuntos del **28,08%**
  donde la app usa 27,5% (Decreto 1601 de 2022). Puede ser un error de esa
  página; vale confirmarlo antes de tocar nada.

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

**Uno de estos supuestos ya se corrigió (25 de agosto de 2026).** Al investigar
contenido para el nicho de CDT + seguridad social apareció que el motor comparaba
el ingreso **bruto** contra 1 SMMLV, cuando el art. 89 de la Ley 2277 de 2022 mide
ese umbral sobre el ingreso **neto** (después de costos), como confirma el ABC de
rentistas de capital de la UGPP. El error activaba la obligación antes de tiempo:
en la franja de $1.750.905 a $2.415.041 de interés bruto mensual cobraba $499.008
que no correspondían, y dejaba el tope máximo de inversión un 38% por debajo de lo
que la ley permite ($15.917.317 en vez de $21.954.920 al 11% E.A.). Se corrigió y
se dejó **configurable** (neto por defecto, bruto disponible), porque es una
interpretación de norma y no una constante. **Sigue valiendo la pena que un contador
revise esta y las demás.**

### Sin actualización automática de dependencias
Dependabot o Renovate abren PRs cuando salen parches de seguridad. Con el CI ya
montado, cada PR se valida solo.
