# Pendientes — Optimizador de CDTs

Estado a 24 de agosto de 2026. Salió de una auditoría del código y de dos
investigaciones sobre el mercado colombiano. La versión con el detalle completo
de cada propuesta está en el documento de ruta compartido aparte.

**Ya desplegado en producción** (commit `21fde9d`): los tres errores de cálculo,
los parámetros configurables, la persistencia, la comparación de escenarios A/B,
la carga inicial reducida de 877 KB a 263 KB, la tipografía Inter, el focus trap
del modal de aviso legal, las pruebas de `pdfExport.js` y `PortfolioChart.jsx`,
y el bug del SMMLV fijo en el gráfico que no seguía el año gravable seleccionado.

**Resuelto y verificado, en PR pendiente de merge**: tabla accesible equivalente
al gráfico de flujo mensual (`PortfolioChart.jsx`), para quien usa lector de
pantalla. Suite en 91 pruebas.

---

## Orden de prioridad

Reordenado el 24 de agosto de 2026 a pedido de Luis. El criterio: lo que puede
producir una cifra equivocada o dejar a alguien sin acceso va antes que lo
cosmético. Se trabaja de arriba hacia abajo, cerrando y verificando cada punto
antes de pasar al siguiente.

### 1. Sin Error Boundary
*Calidad e infraestructura.* Un error de render deja la pantalla en blanco sin
explicación, en una herramienta que se usa para decidir sobre la propia plata.

### 2. Auditar contraste en modo oscuro
*Accesibilidad.* Varios textos de color sobre fondos translúcidos
(`bg-orange-900/30` y similares) no se han medido contra el criterio 4.5:1 de
WCAG AA.

### 3. Sin reporte de cobertura
*Calidad e infraestructura.* No hay forma de saber qué porcentaje del motor
ejercitan las 91 pruebas. `vitest --coverage` y un umbral mínimo en el CI.

### 4. Sin cabeceras de seguridad
*Calidad e infraestructura.* Un `vercel.json` con `X-Frame-Options`,
`X-Content-Type-Options` y una CSP evita que alguien incruste la calculadora en
un sitio fraudulento y la haga pasar por suya.

### 5. No hay analítica
*Calidad e infraestructura.* Sin datos no se sabe si entra gente, si agrega CDTs
o si abandona en el formulario. Vercel Analytics respeta la privacidad, no usa
cookies y se activa con una línea — coherente con la promesa de privacidad del
proyecto.

### 6. El favicon sigue siendo el de la plantilla de Vite
*Calidad e infraestructura.* `public/favicon.svg` es un rayo morado que no dice
nada del producto. Debería ser coherente con `public/og-image.png`, que sí tiene
la identidad visual de la app.

### 7. No se puede editar un CDT
*Producto.* Corregir una tasa mal digitada obliga a eliminar y volver a crear.

### 8. La pantalla vacía no enseña nada
*Producto.* Al entrar solo hay un formulario en blanco. Un ejemplo precargado con
un botón de «ver un caso de ejemplo» deja entender la herramienta en tres
segundos, sin teclear.

---

## Hacia dónde puede crecer — nuevas pestañas

**En espera hasta cerrar los ocho puntos anteriores.** Doce propuestas
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
