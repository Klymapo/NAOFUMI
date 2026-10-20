# NAOFUMI · Molde local

Una interfaz móvil y de escritorio para organizar encargos, explorar hipótesis y seguir propuestas, trabajos y cobros. Identidad de tablón, pergamino, estrella y camino en esmeralda y marfil.

## Abrir

Necesitas Node.js 22 o posterior. No se instalan dependencias.

```sh
cd naofumi
npm start
```

Abre `http://127.0.0.1:4173`. El servidor escucha solo en tu equipo. Para usar otro puerto: `PORT=4174 npm start` (bash). Para detenerlo, Ctrl+C. No abras `index.html` directamente: los módulos requieren el servidor local.

Funciona sin internet mientras el servidor local está activo. No hay CDN, fuentes externas, analítica, servicios conectados, sincronización ni solicitudes API. No se ha desplegado. No se incluye service worker: el manifiesto prepara el aspecto instalable, pero no se promete instalación u operación sin servidor.

## Recorrido

- **Hoy:** próximos pasos por fecha y vista de encargos. Acciones completables/reabribles.
- **Tablón:** ingreso y edición, búsqueda/filtros, guardadas, detalle de evidencia, notas, archivo y restauración.
- **Explorar:** señal, hipótesis y registro de validación, con edición e historial, sin atribuir contratación.
- **Misiones:** propuestas con versiones, registro explícito de hechos externos, trabajos/acuerdos versionados, entregables y cobros separados por moneda.
- **Perfil:** servicios, disponibilidad, idiomas, capacidades editables con evidencia declarada y saldo informativo de connects.
- **Mi espacio:** preferencias, copia JSON/exportación/importación conservadora, fuentes, guía y galería de carga/vacío/error/acceso/sin internet/fuente caída/cerrada.
- Búsqueda global con Ctrl/Cmd+K, panel de notificaciones internas, Escape para cerrar y aviso ante cambios sin guardar.

**Ejemplos** contiene únicamente datos ficticios. **Mi espacio** empieza vacío. Cambiar no borra ni mezcla datos. En móvil, entra por el avatar → Mi espacio para acceder a ajustes, fuentes, archivo y guía.

## Datos y límites

Se guardan en localStorage de este navegador y origen. Cambiar de navegador, equipo o puerto cambia de almacenamiento. No es una bóveda ni tiene autenticación: no guardar secretos o información sensible. Si el navegador bloquea o llena el almacenamiento, el cambio no se confirma. Mantén una sola pestaña editando; se detectan escrituras desde un estado desactualizado, pero no hay bloqueo distribuido.

Exporta copias con frecuencia. Importar añade registros del mismo espacio, rechaza formatos inválidos y conflictos sin reemplazar datos anteriores. La copia JSON no contiene adjuntos: las referencias no respaldan los archivos. Una copia no es por sí misma una prueba de recuperación de servidor.

Archivar conserva los registros. No hay borrado ni purga automática. La demo tampoco tiene botón de reset destructivo. Las preferencias de notificación solo afectan avisos internos; no solicitan permisos de notificación del sistema.

No se verifican fuentes, apertura, cliente o capacidades. Los ingresos manuales permanecen por revisar; las fechas declaradas no se certifican. No se calcula probabilidad de contratación. No se envían mensajes, no se gasta saldo ni se procesa dinero. Devoluciones, conversiones y conciliación compleja no están implementadas; no usar el molde como contabilidad definitiva.

## Archivos

`src/domain.js` contiene reglas; `store.js`, persistencia; `views/`, pantallas; `forms.js`, formularios; `app.js`, navegación y eventos; `ui.js` e `icons.js`, componentes; `styles.css`, diseño adaptable. `assets/` contiene ilustraciones SVG originales. Tipografías del sistema: Georgia y sans serif, sin descargar Bitter/Source Sans. No hay dependencias de producto instaladas.

Las conexiones están documentadas en [INTEGRACIONES.md](docs/INTEGRACIONES.md), con puertos que fallan de forma explícita y sin transporte. Se prepararon después del molde. [PLAN_MOLDE.md](docs/PLAN_MOLDE.md) registra alcance y decisiones.

La documentación completa del estado entregado, repositorio, funciones, pruebas, decisiones y pendientes está en [ENTREGA_Y_ESTADO.md](docs/ENTREGA_Y_ESTADO.md). El respaldo completo V02 añade el encargo original, la especificación Lápiz, la referencia visual elegida y un manifiesto SHA-256; la versión de la app permanece en 0.1.0.

## Comprobaciones

```sh
npm test
npm run check
```

Pruebas de navegador: con el servidor local activo y Playwright/Chromium ya disponibles, ejecutar `node tests/browser.mjs`, `node tests/flows.mjs`, `node tests/drafts.mjs` y `node tests/accessibility.mjs`. En este entorno usan herramientas preinstaladas; para otra máquina, indicar `PLAYWRIGHT_MODULE` (ruta al módulo ESM de Playwright) y `CHROMIUM_PATH` (ejecutable de Chromium). No son dependencias de ejecución de la app y no se descargan automáticamente.

Los escenarios de prueba utilizan contextos de navegador temporales aislados. No modifican los datos personales de una sesión real. Las capturas están en `artifacts/`.

Resultado comprobado: 13 pruebas de dominio/persistencia y 2 de conexiones desactivadas; recorridos de navegador, exportación/restauración local en contexto vacío, protección de borradores y salto al contenido. El control automatizado de accesibilidad cubre contraste de texto sobre fondos sólidos, tamaño de botones y desbordamiento en 9 pantallas a 360, 430 y 1440 px; no es una certificación WCAG ni una prueba con todos los lectores de pantalla. Probado con Chromium, no con Safari/Firefox.

## Alcance de MARTILLO

El usuario autorizó construir el molde local, completar UX/UI y dejar las API al final y desactivadas. No se modificaron documentos maestros ni otros proyectos. La arquitectura de producción, identidad real y políticas pendientes del encargo siguen sujetas a decisiones explícitas. No se crearon cuentas, infraestructura, integraciones remotas, repositorios o commits.

---

## Origen de este repositorio

Migrado el 2026-10-20 desde el respaldo `NAOFUMI_RESPALDO_COMPLETO_V02_2026-10-19.zip` (Drive de Gaston, carpeta `APPS/NAOFUMI`; SHA-256 `8790a50c…3d45d1`, verificado antes de subir). El código no se modificó en la migración.

- `docs/lapiz/`: especificación de diseño (Lápiz).
- `docs/referencias/`: encargo original y lámina visual elegida.
- `docs/respaldo-drive/`: índice y manifiesto SHA-256 del ZIP original. Las rutas del manifiesto son las del ZIP, no las de este repo.

El **reporte maestro** sigue en Drive (Google Doc `NAOFUMI — REPORTE MAESTRO`) y es la fuente de verdad del proyecto y de su Registro de cambios.
