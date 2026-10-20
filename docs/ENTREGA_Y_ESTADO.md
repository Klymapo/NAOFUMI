# NAOFUMI — Entrega y estado completo del molde local

Fecha: 2026-10-19 · Versión del producto: 0.1.0 · Responsable de decisiones: Admin / Atátoriz.

## Estado y autorización

Admin autorizó explícitamente MARTILLO para codificar el molde, terminar primero la interfaz y sus recorridos, dejar las API al final y conservar las conexiones externas desactivadas. Posteriormente solicitó documentar todo y, si no había repositorio propio, comprimirlo y guardarlo en Gastón.

**Resultado actual:** molde funcional local, con interfaz móvil/escritorio, almacenamiento en el navegador y ejemplos separados del espacio personal. No es una implementación completa de la arquitectura de producción descrita en Lápiz. No hay despliegue, backend remoto, autenticación real, recolección automática ni fuentes verificadas.

## Repositorio y ubicación

El código se creó en `/workspace/naofumi`. No se inicializó repositorio, no hay carpeta `.git` propia y `git rev-parse --show-toplevel` devuelve que no es un repositorio Git. La búsqueda `user:Klymapo NAOFUMI in:name` del 2026-10-19 no devolvió repositorios visibles con ese nombre. No existe URL de repositorio verificada para esta entrega; no se creó uno como parte del respaldo.

Destino documental autorizado: cuenta Gastón (`gstn762@gmail.com`), carpeta [APPS / NAOFUMI](https://drive.google.com/drive/folders/10tyNoc_jFLr1VCu2JALVOibG_HKdWJ9A). El paquete y este reporte se depositan en esa carpeta sin cambiar permisos de acceso. Las escrituras realizadas se documentan en el Registro de cambios del reporte maestro.

## Funciones construidas

| Área | Comportamiento disponible |
|---|---|
| Hoy | Vista de próximos pasos ordenados por fecha, conteos derivados del espacio y acceso al tablón |
| Tablón | Alta/edición manual de encargos, búsqueda, categoría, orden, guardadas, cerradas y archivo |
| Detalle de encargo | Descripción, requisitos, fechas declaradas, presupuesto y costo desconocido explícito; pestañas de resumen/evidencia/notas; borrador, acción y archivo |
| Exploración | Registro y edición de señal/hipótesis, acción de validación, validaciones e historial; sin atribuir intención de contratar automáticamente |
| Propuestas | Borradores y versiones conservadas; registro confirmado de hechos externos; transiciones guardadas, sin ejecutar envío |
| Trabajos | Acuerdo inicial, cambios de alcance versionados, estados, referencias de entregables y aceptación explícita para terminar |
| Cobros | Registro manual de recepción, moneda e importe; saldo derivado por moneda; entrega independiente del cobro; no procesamiento de pagos |
| Perfil | Presentación, servicios, idiomas, disponibilidad, capacidades editables con evidencia declarada y saldo de connects declarado |
| Acciones | Alta, edición, fecha opcional, completar/reabrir y conservación de versiones previas |
| Notificaciones | Panel de avisos internos, lectura individual/global y avisos de resultado de operaciones; sin permisos ni notificaciones del sistema |
| Respaldo de datos | Exportación JSON del espacio actual; importación validada que añade sin reemplazar registros conflictivos; restauración local probada en contexto vacío |
| Archivo | Apartar/restaurar sin borrar; deshacer archivo y conservación del contenido |
| Preferencias | Densidad de listas, reducción de movimiento y avisos internos |
| Ayuda y estados | Guía de uso; galería rotulada de carga, vacío, error, acceso restringido, sin internet, fuente caída y oportunidad cerrada |

Las pantallas de la galería son demostraciones visuales; no representan conexiones ejecutadas ni fallos reales de proveedores. Los avisos no constituyen un servicio programado en segundo plano: la app debe estar abierta para consultarlos.

## UX/UI implementada

- Identidad de Tablón de misiones, pergamino sujeto, estrella y camino; esmeralda, marfil y latón. SVG originales del molde, sin copiar personajes o insignias de anime.
- Navegación lateral en escritorio e inferior en móvil: Hoy, Tablón, Explorar y Misiones. Avatar para Perfil; desde Perfil se accede a Mi espacio y desde allí a fuentes, archivo, ayuda y galería.
- Tipografías del sistema, sin descargar fuentes. La propuesta Bitter/Source Sans permanece candidata para una etapa posterior, no instalada.
- Formularios etiquetados, ayudas asociadas, validación visible, avisos de error y confirmación; búsqueda global con Ctrl/Cmd+K.
- Paneles modales con foco, cierre por Escape y protección de cambios pendientes. Los cambios del formulario principal se conservan al guardar desde un modal; cambiar de pestaña con notas pendientes pide confirmar el descarte.
- Enlace de salto al contenido operativo; navegación por teclado en pestañas; texto y estados que no dependen únicamente del color.
- Contraste de texto sobre fondos sólidos, botones de al menos 44 px y ausencia de desbordamiento horizontal comprobados en 9 pantallas a 360, 430 y 1440 px. No equivale a auditoría WCAG completa ni prueba de todos los lectores de pantalla.

## Arquitectura que realmente existe

| Archivo o directorio | Responsabilidad |
|---|---|
| `index.html`, `manifest.webmanifest` | Entrada, metadatos y presentación instalable candidata; no hay service worker |
| `styles.css`, `assets/` | Diseño adaptable, icono/ilustración locales y estados visuales |
| `src/app.js` | Navegación por hash, eventos, paneles, protección de borradores, búsqueda, avisos y formularios |
| `src/views/` | Hoy, Tablón, Explorar, Misiones, detalles, Perfil, Mi espacio, fuentes, ayuda y estados |
| `src/ui.js`, `src/icons.js`, `src/forms.js` | Componentes HTML escapados, iconos y formularios |
| `src/domain.js` | Datos, validación, transiciones, importes enteros en unidades menores, archivo/historial y fusión conservadora de respaldos |
| `src/store.js` | Persistencia local, separación de espacios, exportación/importación y rechazo de escritura desde estado desactualizado |
| `src/demo.js` | Escenarios ficticios, sin atribuir capacidades ni oportunidades reales a Admin |
| `src/integrations.js` | Contratos y puertos remotos explícitamente desactivados; sin transporte HTTP |
| `server.mjs` | Servidor de archivos estáticos ligado a `127.0.0.1`, restricciones de rutas y CSP `connect-src 'none'` |
| `tests/` | Dominio, persistencia, bloqueo de conexiones y recorridos de navegador |
| `scripts/` | Comprobación de sintaxis/recursos y generación local de capturas |
| `artifacts/` | Capturas, resultado del control de accesibilidad y registro de comprobaciones del paquete |

Se eligieron módulos JavaScript nativos para evitar instalar dependencias y mantener la ejecución local sencilla. React/TypeScript/Vite, Workers y D1 eran candidatos de Lápiz; no se instalaron ni aprovisionaron. Una migración futura de UI requiere trabajo; las reglas y las fronteras de almacenamiento/transporte están separadas para facilitarla. El esquema local es más pequeño que el modelo de producción diseñado.

## Datos, conservación y seguridad local

`Ejemplos` y `Mi espacio` tienen claves de localStorage separadas. Mi espacio empieza vacío. Archivar no borra ni libera cuota. El cambio de espacio no copia datos entre ellos.

El almacenamiento depende del navegador y del origen, incluido el puerto. No es una bóveda ni una sesión privada autenticada. No contiene credenciales de integración. Si se borra el almacenamiento del navegador, se utiliza modo privado o se cambia de equipo/origen, la copia del código no recupera los registros personales: se necesita la exportación JSON de la app.

La escritura que falla por cuota no se confirma; el estado anterior queda intacto. Se detecta si otra pestaña cambió la versión persistida, pero no existe bloqueo distribuido: conviene mantener una única pestaña editando. La importación rechaza formatos y fechas inválidas, HTML en campos estructurales, perfiles distintos y versiones conflictivas sin aplicar una sustitución parcial.

Los textos aportados se escapan al renderizarse. Los enlaces se guardan y pueden copiarse, pero no se consultan. Una URL pegada no verifica el original. Los puertos de integración rechazan con `CONNECTIONS_DISABLED`; las preferencias no pueden habilitarlos. La CSP bloquea conexiones de la app. No hay analítica ni CDN.

## Pruebas y revisión realizadas

Comprobaciones ejecutadas el 2026-10-19 en Node v24.19.0 y Chromium del entorno:

| Comando | Resultado y alcance |
|---|---|
| `npm test` | 13 pruebas de dominio/persistencia y 2 de conexiones bloqueadas, aprobadas |
| `npm run check` | Sintaxis de 17 módulos y presencia de recursos locales, aprobadas |
| `node tests/browser.mjs` | Navegación, ingreso, recarga, archivo/deshacer, separación de espacios, paneles y 360/430 px; cero solicitudes externas observadas |
| `node tests/flows.mjs` | Perfil/capacidades editables, hipótesis/validación, propuestas versionadas, guardas de registro de envío, entregables, cobros, XSS, búsqueda, exportación e importación en contexto vacío |
| `node tests/drafts.mjs` | Borradores conservados al guardar en modal, advertencia de salida/cambio de pestaña, Escape seguro y salto al contenido |
| `node tests/accessibility.mjs` | Sin hallazgos en contraste de texto sobre fondos sólidos, botones y desbordamiento en 27 combinaciones de pantalla/ancho |

No se probaron APIs de fuentes, servidores de producción, Safari/Firefox, notificaciones del sistema, rendimiento de Workers/D1 ni restauración de servidor. El almacenamiento/restauración comprobados son locales al molde.

La revisión independiente encontró cuatro problemas y se corrigieron con regresiones: reemplazo de perfil incompleto al importar; pérdida de borradores al actuar desde modal o pestaña; validación insuficiente de estructuras/fechas anidadas y salida de versiones; enlace para saltar al contenido que alteraba la ruta. Se añadió edición de capacidades, señales y acciones para completar datos gradualmente.

## Ejecución y recuperación

1. Descomprimir el paquete y entrar en `naofumi`.
2. Usar Node.js 22 o posterior y ejecutar `npm start`; no es necesario `npm install`.
3. Abrir `http://127.0.0.1:4173`. Detener con Ctrl+C. Si se cambia el puerto, el navegador tratará los datos como otro origen.
4. Entrar por avatar → Mi espacio para exportar/importar JSON. Importar solo una copia del mismo espacio; ante conflicto no se reemplazan los registros existentes.
5. Para recuperar datos en otro navegador, abrir la app, elegir el espacio correspondiente e importar su JSON. Las referencias a archivos no incluyen los archivos referidos.

El ZIP conserva código, documentos, pruebas, capturas y referencias; **no incluye registros personales de un navegador** ni credenciales. El manifiesto SHA-256 por archivo permite verificar que se conservó el contenido. El manifiesto no se incluye a sí mismo y el hash del ZIP se registra fuera del ZIP.

## Pendientes antes de producción o conexiones

- Catálogo real de servicios/evidencias, idiomas, disponibilidad y exclusiones de Admin.
- Identidad/autenticación, autorización servidor, proveedor gratuito y acceso propio.
- API/backend durables, reglas aprobadas de admisión/antigüedad, TTL y revalidación de fuentes.
- Permisos, condiciones, cuotas y utilidad de cada fuente; un conector autorizado a la vez.
- Modelo completo y migraciones, transacciones/idempotencia, secretos, seguridad SSRF y controles de operación.
- Respaldos fuera del proveedor, ensayo de restauración de servidor y política de conservación.
- Devoluciones, conciliación compleja, conversiones y contabilidad definitiva.
- Sincronización y service worker si se aprueban. El molde requiere servidor local activo.
- Muestra y criterios de calidad antes de correo; autorización separada para push, envíos, compras o gastos.

No se garantiza cobertura total, ausencia de fraude o probabilidad de contratación. No hay repositorio ni infraestructura creados. No se modificaron RACOON, ATLAS, COPOX u otros proyectos.

## Registro de esta entrega

2026-10-19 — Se lee el encargo, se consultan maestros/referencia visual y se produce la especificación Lápiz.

2026-10-19 — Admin autoriza MARTILLO para el molde local, con API al final y conexiones desactivadas. Se implementan y verifican las funciones descritas; se prepara el primer ZIP local.

2026-10-19 — Admin solicita documentación completa y respaldo en Gastón si no existe repositorio. Se comprueba ausencia de repositorio local y búsqueda sin resultados por nombre en Klymapo; se consolida esta documentación, se prepara inventario/hash y un paquete completo versionado. El depósito y sus enlaces verificados se registran en el maestro de Gastón, conservando su historial y los archivos anteriores.
