# Optimizador de CDTs

Simulador web para calcular la **rentabilidad real** de inversiones en CDTs en Colombia, y encontrar el tope máximo de inversión que evita legalmente la obligación de cotizar a seguridad social como rentista de capital.

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
| Situación laboral | Rentista de capital | Determina si aplican salud, pensión y el piso de 1 SMMLV |
| Componente inflacionario | Desactivado | Su porcentaje se fija por decreto **después** de terminado el año |
| Tope del IBC | 25 SMMLV | Límite legal superior del ingreso base de cotización |

### Sobre la situación laboral

| Situación | Salud | Pensión | Piso de 1 SMMLV |
|---|---|---|---|
| Rentista de capital | Sí | Sí | Aplica |
| Pensionado | Sí | No | Aplica |
| Ya cotiza como empleado | Sí | Sí | No vuelve a aplicar |
| Ya cotiza como independiente | Sí | Sí | No vuelve a aplicar |

Para quienes ya cotizan por otro ingreso, la app pide el IBC que ya se cotiza para aplicar
el techo de 25 SMMLV sobre la base combinada. **Estos son supuestos simplificados**: el
tratamiento real tiene matices y conviene validarlo con un contador.

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

## Pruebas

El proyecto usa [Vitest](https://vitest.dev/) y [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

- `src/OptimizationEngine.test.js` — la lógica de cálculo: tasas periódicas, seguridad social, validaciones y la consolidación/prorrateo mensual del portafolio. Es la parte crítica: un error aquí significa un cálculo incorrecto para un usuario real.
- `src/components/CDTSimulator.test.jsx` — validaciones del formulario, agregar y eliminar CDTs, cálculo del tope máximo, y exportación a PDF.
- `src/components/DisclaimerModal.test.jsx` — el aviso legal y que solo se cierre al aceptarlo explícitamente.
- `src/components/ThemeToggle.test.jsx` — alternancia de tema claro/oscuro.
- `src/parametros.test.js` — los parámetros configurables: retención, componente inflacionario, situación laboral y constantes por año.
- `src/components/ParametrosPanel.test.jsx` — el panel de parámetros.
- `src/components/ComparadorEscenarios.test.jsx` — la comparación A/B.

Hay un bloque de **pruebas de regresión** en `OptimizationEngine.test.js` que cubre tres errores
de cálculo detectados en una auditoría: el techo de 25 SMMLV que faltaba, los periodos parciales
que se perdían cuando el plazo no era múltiplo de la frecuencia, y el desbordamiento de fechas a
fin de mes. Cada una se escribió antes del arreglo y fallaba con el código anterior.

Cada push y cada pull request ejecuta lint, pruebas y build automáticamente vía GitHub Actions.

> Al agregar una funcionalidad o modificar `OptimizationEngine.js`, agrega o actualiza sus pruebas antes de dar el cambio por terminado.

## Estructura

```
src/
├── OptimizationEngine.js   # Lógica de cálculo (sin dependencias de UI)
├── parametros.js           # Constantes legales por año y parámetros configurables
├── almacenamiento.js       # Persistencia en localStorage, a prueba de fallos
├── pdfExport.js            # Generación del PDF (se carga solo al exportar)
├── vacio.js                # Stub que saca html2canvas y dompurify del bundle
├── App.jsx                 # Layout general
├── hooks/
│   ├── useTheme.js             # Tema claro/oscuro persistido
│   └── useEstadoPersistido.js  # useState que recuerda entre visitas
└── components/
    ├── CDTSimulator.jsx        # Formulario, tabla consolidada y escenarios
    ├── ParametrosPanel.jsx     # Panel de parámetros configurables
    ├── ComparadorEscenarios.jsx# Comparación A/B
    ├── PortfolioChart.jsx      # Gráfico de flujo mensual
    ├── DisclaimerModal.jsx     # Aviso legal de entrada
    └── ThemeToggle.jsx         # Botón de tema
```

Toda la lógica financiera vive en `OptimizationEngine.js`, aislada de React, para que sea fácil de probar y auditar.

## Privacidad

La aplicación funciona **enteramente en el navegador**. No hay backend y no se envía ningún dato a ningún servidor: los cálculos ocurren en tu dispositivo.

Para que no pierdas el trabajo al recargar, el portafolio, los parámetros y el tema se guardan
en el `localStorage` de tu navegador. Esa información **nunca sale de tu equipo** y puedes
borrarla en cualquier momento limpiando los datos del sitio. Tampoco hay analítica ni peticiones
a dominios externos: incluso la tipografía se sirve desde el propio dominio.

## Actualizar para un año nuevo

Todo lo que cambia cada enero está en `CONSTANTES_POR_ANIO` dentro de `src/parametros.js`.
Agregar un año es añadir una entrada a esa tabla — no hay que tocar el motor de cálculo.

Cuando salga el decreto del componente inflacionario de un año, basta con poner su porcentaje
en la entrada correspondiente; los usuarios ya pueden ingresarlo a mano mientras tanto.

## Licencia

[MIT](LICENSE)
