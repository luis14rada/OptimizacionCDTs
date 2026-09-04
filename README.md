# Optimizador Financiero

Simulador web con tres herramientas para entender tu plata en Colombia:

1. **Optimizador de CDTs** — calcula la **rentabilidad real** de inversiones en CDTs, y encuentra el tope máximo de inversión que evita legalmente la obligación de cotizar a seguridad social como rentista de capital.
2. **[¿Cuánto te cuesta tu cuenta de ahorros?](#cuánto-te-cuesta-tu-cuenta-de-ahorros)** — compara la tasa de tu cuenta de ahorros contra otras del mercado y contra la inflación.
3. **[Rentabilidad real: la cadena completa](#rentabilidad-real-la-cadena-completa)** — de la tasa nominal de cualquier producto hasta lo que realmente queda después de retención en la fuente e inflación.

> [!WARNING]
> **Esta herramienta es un simulador educativo e informativo.** No constituye asesoría contable, tributaria, financiera ni legal, y **no reemplaza a un contador público o asesor profesional**. Los cálculos se basan en supuestos generales que pueden no aplicar a tu situación particular, cambiar con el tiempo, o interpretarse de forma distinta según cada caso. Valida siempre tu caso específico con un profesional autorizado. El uso es bajo tu propio riesgo y no se asume responsabilidad por errores, omisiones ni por decisiones tomadas con base en sus resultados.

## Qué resuelve

En Colombia, quien recibe rentas de capital (como los intereses de un CDT) puede quedar obligado a cotizar salud y pensión ante la UGPP si en un mes calendario sus ingresos superan 1 SMMLV. La complicación es que **la UGPP consolida todos los ingresos del mismo mes**, no cada CDT por separado — así que dos CDTs que individualmente no llegan al tope sí pueden activarlo si vencen el mismo mes.

Este simulador modela exactamente eso:

- Agrupa los pagos de todos los CDTs del portafolio **mes a mes**.
- Si en algún mes la suma supera 1 SMMLV, calcula la seguridad social de ese mes y la **prorratea** entre los CDTs que pagaron en él.
- Calcula el **tope máximo de inversión** que mantiene cada pago por debajo del umbral.
- Descuenta retención en la fuente (4% o 7%, configurable) para mostrar el interés neto real.

## Funcionalidades

- Simulación de múltiples CDTs con distintas frecuencias de pago (mensual, trimestral, semestral, anual o al vencimiento).
- Consolidación mensual del portafolio con prorrateo de seguridad social, respetando el piso de 1 SMMLV y el techo de 25 SMMLV.
- **Parámetros configurables**: año gravable, retención en la fuente (4% o 7%), costos presuntos, situación laboral y componente inflacionario. Ver la sección siguiente.
- **Comparación de escenarios A/B**: el mismo portafolio bajo dos supuestos distintos, con la diferencia en pesos.
- El portafolio y los parámetros **se recuerdan entre visitas**, guardados solo en tu navegador.
- Gráfico del flujo de intereses por mes contra el umbral de 1 SMMLV.
- Exportación a **CSV** y a **PDF** (generado a medida, con paginación, todas las columnas y los supuestos usados impresos).
- Modo claro/oscuro con preferencia recordada.
- Validaciones de formulario y soporte de accesibilidad (etiquetas, roles ARIA, navegación por teclado).

## Parámetros de cálculo

Ningún valor legal está incrustado en la lógica: todos viven en `src/parametros.js` y son
ajustables desde la interfaz, porque cambian cada año.

| Parámetro | Por defecto | Notas |
|---|---|---|
| Año gravable | 2026 | Al cambiarlo se cargan el SMMLV y las tarifas de ese año |
| Retención en la fuente | 4% | 7% para no declarantes, o un valor personalizado |
| Costos presuntos UGPP | 27,5% | Se descuentan del ingreso antes de calcular el IBC |
| Situación laboral | Ya cotizo como empleado | Determina si aplican salud, pensión y el piso del IBC |
| Componente inflacionario | Desactivado | Su porcentaje se fija por decreto **después** de terminado el año |
| Tope del IBC | 25 SMMLV | Límite legal superior del ingreso base de cotización |
| Base del umbral de 1 SMMLV | Ingreso neto | Sobre qué se compara el umbral que activa la obligación. Ver la sección siguiente |
| El umbral aplica con salario | Sí | Si el umbral se le exige también a quien ya cotiza por un empleo. Ver la sección siguiente |

### Sobre qué ingreso se mide el umbral de 1 SMMLV

El [artículo 89 de la Ley 2277 de 2022](http://secretariasenado.gov.co/senado/basedoc/ley_2277_2022_pr002.html)
obliga a cotizar a quien tenga «ingresos **netos** mensuales iguales o superiores a un (1) salario
mínimo legal mensual vigente» — netos, es decir después de restar los costos (los presuntos del
27,5 % o los reales del art. 107 del Estatuto Tributario). Lo confirma el
[ABC de rentistas de capital de la UGPP](https://www.ugpp.gov.co/abc_rentistas_capital/).

La diferencia es material: con el SMMLV de 2026 ($1.750.905) y el 27,5 % de costos presuntos, medir
sobre el neto mueve el umbral de **$1.750.905 a un bruto equivalente de $2.415.041**. Medirlo sobre
el bruto activa la obligación antes de tiempo y, en consecuencia, calcula un tope máximo de
inversión más bajo del que la ley permite.

Se dejó **configurable** en vez de imponerlo: es una interpretación de norma, no una constante.
Quien prefiera el criterio conservador —o cuyo contador lo lea distinto— puede cambiarlo a bruto
desde el panel «Parámetros de cálculo».

> Este cálculo tiene dos pasos que es fácil confundir. El umbral (**¿estoy obligado?**) se compara
> contra el ingreso neto; el IBC (**¿sobre cuánto aporto?**) es ese mismo neto multiplicado por 40 %,
> con piso de 1 SMMLV y techo de 25. Los costos se restan en los dos, no solo en el segundo.

### Sobre la situación laboral

| Situación | Salud | Pensión | Umbral de 1 SMMLV | Piso del IBC |
|---|---|---|---|---|
| Rentista de capital | Sí | Sí | Aplica | Aplica |
| Pensionado | Sí | No | Aplica | Aplica |
| Ya cotiza como empleado | Sí | Sí | Aplica | No vuelve a aplicar |
| Ya cotiza como independiente | Sí | Sí | Aplica | No vuelve a aplicar |

Son dos cosas distintas y la app las separa. El **umbral** decide *¿debo cotizar?*; el **piso
del IBC** decide *¿sobre qué base mínima?*. Quien ya cotiza por un salario no vuelve a
necesitar el piso —su base mínima ya está cubierta— pero sí conserva el umbral.

### ¿El umbral aplica a quien ya tiene salario?

El caso más común de esta app es alguien empleado que además abre un CDT. El
[artículo 89 de la Ley 2277 de 2022](http://secretariasenado.gov.co/senado/basedoc/ley_2277_2022_pr002.html)
hace nacer la obligación cuando se perciben ingresos netos de 1 SMMLV al mes, **sin
condicionarla a tener o no vínculo laboral**, y el
[ABC de rentistas de capital de la UGPP](https://www.ugpp.gov.co/abc_rentistas_capital/) trata como
trabajador independiente a quien, teniendo salario, percibe además otros ingresos — es decir, con la
misma regla y el mismo umbral.

Por eso el valor por defecto es que **sí aplica**. Ningún concepto oficial resuelve expresamente el
caso mixto, así que se dejó configurable: el criterio conservador (aportar desde el primer peso) se
recupera desde el panel de parámetros.

La diferencia no es menor. Con un salario de $5.000.000 de IBC y un CDT de $50.000.000 al 11,5% E.A.
mensual, el criterio conservador cobra **$37.657 al mes** donde la lectura literal de la norma no
cobra nada.

Para quienes ya cotizan por otro ingreso, la app pide el IBC que ya se cotiza para aplicar
el techo de 25 SMMLV sobre la base combinada. **Estos son supuestos simplificados**: el
tratamiento real tiene matices y conviene validarlo con un contador.

## ¿Cuánto te cuesta tu cuenta de ahorros?

Segunda herramienta de la app. En el mismo mes, las cuentas de ahorro en Colombia pagan
tasas muy distintas por el mismo riesgo y la misma liquidez. La pestaña compara el saldo
de tu cuenta actual contra otra entidad (o una tasa que ingreses a mano), y muestra:

- El rendimiento nominal anual de cada una.
- El **retorno real** de tu cuenta actual, descontando inflación (ecuación de Fisher:
  `(1 + tasa) / (1 + inflación) - 1`). Puede dar negativo: el saldo crece en pesos, pero
  pierde poder adquisitivo si la tasa no alcanza a cubrir la inflación.

### Datos y su fuente

Las tasas viven en `src/tasasAhorro.js`, con su fecha de corte -- mismo patrón que
`CONSTANTES_POR_ANIO` en `src/parametros.js`, para actualizarlas sin tocar lógica.

- **Tasas de ahorro**: [Superintendencia Financiera de Colombia](https://www.superfinanciera.gov.co/), tasa de captación E.A. por entidad (promedio ponderado de lo efectivamente captado), corte 17 de junio de 2026.
- **Inflación**: IPC de julio de 2026, [DANE](https://www.dane.gov.co/files/operaciones/IPC/jun2026/bol-IPC-jun2026.pdf), 6,03% anual.

Solo se incluyen entidades con cifra exacta de esa misma fuente y fecha. Por eso **no
aparecen BBVA ni Davivienda**: de esos bancos solo se encontró la tasa promocional de un
producto puntual (por ejemplo, una cuenta a plazo fijo), no el promedio comparable con el
resto de la tabla -- mezclar esas dos metodologías habría hecho la comparación engañosa.
Quien no encuentre su entidad puede elegir "Otra entidad" e ingresar su tasa real.

> Mostrar y comparar tasas públicas es informar. La herramienta nunca nombra una entidad
> como "la mejor": muestra el ordenamiento y deja que el número hable. No es una
> recomendación de dónde poner tu plata.

## Rentabilidad real: la cadena completa

Tercera herramienta de la app. La tasa que anuncia cualquier producto -- un CDT, un fondo,
una cuenta -- no es lo que realmente te queda. Primero se descuenta la retención en la
fuente, y lo que sobra se lo come la inflación. Esta pestaña no está atada a un producto ni
a una entidad: ingresas la tasa nominal E.A. que quieras comparar y la app muestra cada
eslabón de la cadena:

**Tasa nominal E.A. → (– retención en la fuente) → tasa neta → (– inflación) → retorno real**

No agrega datos nuevos: reutiliza los mismos ya sourceados para el resto de la app --
`OPCIONES_RETENCION` de `src/parametros.js` (4% declarante / 7% no declarante) y
`INFLACION_ANUAL_REFERENCIA` de `src/tasasAhorro.js`. El motor (`RentabilidadRealEngine.js`)
reutiliza a su vez `calcularRetornoReal` de `AhorrosEngine.js` en vez de duplicar la ecuación
de Fisher.

Con los valores por defecto (10% nominal, retención del 4%), solo sobrevive el **33,67% de
la ganancia en términos reales** -- ilustra por qué conviene mirar la cadena completa, no
solo la tasa que anuncia el producto.

## Stack

React 19 · Vite 8 · Tailwind CSS 4 · jsPDF · Vitest + React Testing Library · Oxlint

## Desarrollo local

Requiere Node.js 20.19+ o 22.12+.

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

### Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run lint` | Análisis estático con Oxlint |
| `npm test` | Corre toda la suite de pruebas una vez |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run test:coverage` | Pruebas con reporte de cobertura (ver sección de abajo) |

## Pruebas

El proyecto usa [Vitest](https://vitest.dev/) y [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

- `src/OptimizationEngine.test.js` — la lógica de cálculo: tasas periódicas, seguridad social, validaciones y la consolidación/prorrateo mensual del portafolio. Es la parte crítica: un error aquí significa un cálculo incorrecto para un usuario real.
- `src/components/CDTSimulator.test.jsx` — validaciones del formulario, agregar y eliminar CDTs, los tres estados del tope máximo (hay tope, no existe tope, tope copado), y exportación a PDF.
- `src/components/DisclaimerModal.test.jsx` — el aviso legal, que solo se cierre al aceptarlo explícitamente, y que el foco quede atrapado dentro del modal.
- `src/components/ThemeToggle.test.jsx` — alternancia de tema claro/oscuro.
- `src/components/PortfolioChart.test.jsx` — el gráfico de flujo mensual desagregado por CDT, la posición de la línea del límite, el aviso de distancia al límite y la tabla accesible equivalente para lectores de pantalla.
- `src/components/ErrorBoundary.test.jsx` — que un error de render muestre un mensaje en vez de pantalla en blanco.
- `src/pdfExport.test.js` — la generación real del PDF (jsPDF sin mockear), incluidos los distintos banners y el uso del año gravable correcto.
- `src/parametros.test.js` — los parámetros configurables: retención, componente inflacionario, situación laboral y constantes por año.
- `src/components/ParametrosPanel.test.jsx` — el panel de parámetros.
- `src/components/ComparadorEscenarios.test.jsx` — la comparación A/B.
- `src/AhorrosEngine.test.js` — el cálculo de retorno real (ecuación de Fisher) de la pestaña de cuenta de ahorros.
- `src/components/CostoCuentaAhorros.test.jsx` — el comparador de cuentas de ahorro: autocompletar tasas, "Otra entidad", y el resultado con inflación.
- `src/RentabilidadRealEngine.test.js` — la cadena tasa nominal → retención → retorno real, incluido el caso de tasa nominal 0% (sin dividir por cero).
- `src/components/CadenaRentabilidadReal.test.jsx` — el formulario de rentabilidad real: cambio de retención, aviso de pérdida de poder adquisitivo, y el mensaje de "menos de la mitad" cuando aplica.
- `src/App.test.jsx` — cambiar de pestaña muestra la herramienta correcta y oculta las otras, y que el encabezado (título y bajada) cambie según la pestaña activa.

Hay varios bloques de **pruebas de regresión** en `OptimizationEngine.test.js`, cada uno escrito
antes de su arreglo y verificado contra el código anterior:

- Los tres errores de la auditoría inicial: el techo de 25 SMMLV que faltaba, los periodos parciales
  que se perdían cuando el plazo no era múltiplo de la frecuencia, y el desbordamiento de fechas a
  fin de mes.
- El umbral de obligación, que se medía sobre el ingreso bruto en vez del neto.
- El tope máximo de inversión, que ignoraba tanto la situación laboral como los CDTs que el
  portafolio ya recibía en el mes — daba un número que la propia simulación contradecía al
  agregarlo.

### Cobertura

`npm run test:coverage` corre la suite con [`@vitest/coverage-v8`](https://vitest.dev/guide/coverage.html)
y genera un reporte en texto (consola), HTML (`coverage/index.html`) y `coverage/coverage-summary.json`.
El CI falla si la cobertura global baja de: 80% statements, 65% branches, 70% functions, 80% lines
(medido el 4 de septiembre de 2026: 90,56% / 78,65% / 80,98% / 91,75% — el umbral queda unos puntos
por debajo como margen).

> La tabla que Vitest imprime en consola tiene un bug conocido en esta versión: omite algunos
> archivos con pruebas de la tabla (confirmado inspeccionando el JSON crudo: los datos están completos
> y el número agregado es correcto). Para el detalle por archivo, abrí `coverage/index.html` en el
> navegador en vez de confiar en la tabla de la terminal.

Cada push y cada pull request ejecuta lint, pruebas con cobertura y build automáticamente vía GitHub Actions.

> Al agregar una funcionalidad o modificar `OptimizationEngine.js`, agrega o actualiza sus pruebas antes de dar el cambio por terminado.

## Estructura

```
src/
├── OptimizationEngine.js       # Lógica de cálculo de CDTs (sin dependencias de UI)
├── AhorrosEngine.js            # Lógica de cálculo de la pestaña de ahorros (retorno real)
├── RentabilidadRealEngine.js   # Cadena tasa nominal -> retención -> retorno real
├── parametros.js               # Constantes legales por año y parámetros configurables
├── tasasAhorro.js              # Tasas de ahorro e inflación de referencia, con fuente y fecha
├── almacenamiento.js           # Persistencia en localStorage, a prueba de fallos
├── pdfExport.js                # Generación del PDF (se carga solo al exportar)
├── vacio.js                    # Stub que saca html2canvas y dompurify del bundle
├── App.jsx                     # Layout general y navegación entre pestañas
├── main.jsx                    # Punto de entrada: monta <App /> dentro del ErrorBoundary
├── hooks/
│   ├── useTheme.js             # Tema claro/oscuro persistido
│   └── useEstadoPersistido.js  # useState que recuerda entre visitas
└── components/
    ├── CDTSimulator.jsx          # Pestaña: Optimizador de CDTs
    ├── CostoCuentaAhorros.jsx    # Pestaña: ¿Cuánto te cuesta tu cuenta de ahorros?
    ├── CadenaRentabilidadReal.jsx# Pestaña: Rentabilidad real, la cadena completa
    ├── ParametrosPanel.jsx       # Panel de parámetros configurables (CDTs)
    ├── ComparadorEscenarios.jsx  # Comparación A/B (CDTs)
    ├── PortfolioChart.jsx        # Gráfico de flujo mensual (CDTs)
    ├── DisclaimerModal.jsx       # Aviso legal de entrada
    ├── ThemeToggle.jsx           # Botón de tema
    └── ErrorBoundary.jsx         # Pantalla de error ante un fallo de render
```

Toda la lógica financiera vive en `OptimizationEngine.js`, aislada de React, para que sea fácil de probar y auditar.

## Privacidad

La aplicación funciona **enteramente en el navegador**. No hay backend: los cálculos ocurren
en tu dispositivo y nunca se envían a ningún servidor.

Para que no pierdas el trabajo al recargar, el portafolio, los parámetros y el tema se guardan
en el `localStorage` de tu navegador. Esa información **nunca sale de tu equipo** y puedes
borrarla en cualquier momento limpiando los datos del sitio.

El único tráfico saliente es [Vercel Analytics](https://vercel.com/docs/analytics), que mide
vistas de página de forma agregada y anónima. Según su propia documentación, no usa cookies, no
guarda la IP completa ni arma una huella digital para seguirte entre sitios. No sabe qué CDTs
simulaste, qué parámetros usaste ni ningún dato del formulario — eso sigue sin salir de tu
navegador. Incluso la tipografía se sirve desde el propio dominio.

## Actualizar para un año nuevo

Todo lo que cambia cada enero está en `CONSTANTES_POR_ANIO` dentro de `src/parametros.js`.
Agregar un año es añadir una entrada a esa tabla — no hay que tocar el motor de cálculo.

Cuando salga el decreto del componente inflacionario de un año, basta con poner su porcentaje
en la entrada correspondiente; los usuarios ya pueden ingresarlo a mano mientras tanto.

Las tasas de `src/tasasAhorro.js` cambian con más frecuencia que una vez al año (los bancos las
ajustan varias veces por año) -- conviene revisarlas cada tanto contra la fuente citada ahí mismo,
no solo en enero.

## Licencia

[MIT](LICENSE)
