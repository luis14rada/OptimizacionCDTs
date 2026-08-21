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
- Descuenta retención en la fuente (4%) para mostrar el interés neto real.

## Funcionalidades

- Simulación de múltiples CDTs con distintas frecuencias de pago (mensual, trimestral, semestral, anual o al vencimiento).
- Consolidación mensual del portafolio con prorrateo de seguridad social.
- Gráfico del flujo de intereses por mes contra el umbral de 1 SMMLV.
- Exportación a **CSV** y a **PDF** (generado a medida, con paginación y todas las columnas).
- Modo claro/oscuro con preferencia recordada.
- Validaciones de formulario y soporte de accesibilidad (etiquetas, roles ARIA, navegación por teclado).

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

Cada push y cada pull request ejecuta lint, pruebas y build automáticamente vía GitHub Actions.

> Al agregar una funcionalidad o modificar `OptimizationEngine.js`, agrega o actualiza sus pruebas antes de dar el cambio por terminado.

## Estructura

```
src/
├── OptimizationEngine.js   # Lógica de cálculo (sin dependencias de UI)
├── pdfExport.js            # Generación del PDF del portafolio
├── App.jsx                 # Layout general
├── hooks/
│   └── useTheme.js         # Tema claro/oscuro persistido
└── components/
    ├── CDTSimulator.jsx    # Formulario, tabla consolidada y exportaciones
    ├── PortfolioChart.jsx  # Gráfico de flujo mensual
    ├── DisclaimerModal.jsx # Aviso legal de entrada
    └── ThemeToggle.jsx     # Botón de tema
```

Toda la lógica financiera vive en `OptimizationEngine.js`, aislada de React, para que sea fácil de probar y auditar.

## Privacidad

La aplicación funciona **enteramente en el navegador**. No hay backend, no se envían datos a ningún servidor y no se almacena información de tus inversiones: al cerrar la pestaña, los datos desaparecen. Lo único que se guarda localmente es tu preferencia de tema.

## Valores de referencia (2026)

| Parámetro | Valor |
|---|---|
| SMMLV | $1.750.905 COP |
| Retención en la fuente | 4% |
| Costos presuntos UGPP | 27,5% |
| Tarifa de salud | 12,5% |
| Tarifa de pensión | 16% |

Estos valores están centralizados como constantes en `src/OptimizationEngine.js` y deben actualizarse cada año.

## Licencia

[MIT](LICENSE)
