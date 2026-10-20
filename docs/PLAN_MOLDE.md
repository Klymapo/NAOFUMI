# Molde local — plan de implementación

Goal: entregar una app local navegable que Admin pueda rellenar, sin conexiones externas.
Spec: ../../NAOFUMI_LAPIZ_ESPECIFICACION_V01.md, con alcance actualizado por MARTILLO de Admin: interfaz y funciones locales primero, integración al final.
Architecture: módulos web nativos, dominio independiente, persistencia local separada por espacio y transporte remoto desactivado. Servidor estático solo loopback. Sin dependencias instaladas.

## Autoridad y decisiones de implementación

MARTILLO autoriza codificar el molde completo sin esperar las respuestas de Lápiz. Las reglas comerciales pendientes no se resuelven por inferencia: datos manuales permanecen por revisar. Los ejemplos están separados y rotulados. No hay autenticación real ni protección de datos sensibles; es un molde de uso local, no producción.

Ruling: usar JavaScript modular nativo en vez de React/TypeScript candidatos — evita descargar dependencias y mantiene todo ejecutable localmente; una futura migración de UI tendría costo, el dominio y contratos son reutilizables.
Ruling: guardado local habilitado por el nuevo alcance de molde sin internet; no se implementa sincronización offline de servidor ni credenciales.
Ruling: nueva carpeta aislada, sin repositorio/commits, maestros intactos y sin borrar archivos. Los scripts git de habilidades no aplican a este workspace sin repositorio.

## Tareas

- [x] 1. Núcleo: `src/domain.js`, `src/store.js`, `src/demo.js`; pruebas de ingreso sin verificación automática, conservación por archivo, monedas y movimientos, almacenamiento fallido y aislamiento de espacios. Interfaces: `createState`, `reduce(state,command)`, `createStore(storage)`.
- [x] 2. UI: `index.html`, `src/app.js`, `src/icons.js`, `src/ui.js`, `src/views/*.js`, `styles.css`, `assets/`; navegación Hoy/Tablón/Explorar/Misiones, detalle, perfil, preferencias, fuentes y ayuda. Recursos locales, 360–430px, teclado/foco, formularios con validación.
- [x] 3. Flujos: ingreso/edición, guardar, archivo/restaurar, propuestas versionadas, trabajo/entregables, cobros independientes, acciones, notificaciones internas, exportar e importar validado sin reemplazar datos. Laboratorio de estados explícitamente simulado. Pruebas de navegador con Chromium local.
- [x] 4. Al final: `src/integrations.js` y `docs/INTEGRACIONES.md`, contratos y adaptador desconectado; ninguna petición externa ni secretos. README de ejecución y límites, revisión independiente final.

## Verificación

`npm test`: invariantes de dominio y persistencia. `npm run check`: sintaxis JS y recursos presentes. Navegador real: recorrer rutas, ingreso y recarga, detalle/archivo, modales/teclado, 360/430/1440 px, ausencia de solicitudes fuera de localhost, CSP, errores y capturas. Un almacenamiento fallido no confirma el guardado. Importación inválida no altera datos. No probar servicios externos.

## Review focus

Datos dañados/cuota de almacenamiento; XSS desde texto pegado; URLs no seguras; transiciones económicas incorrectas; navegación estrecha y foco de modales. Revisar cada uno con pruebas antes de entrega.

## Progreso

Inicio: plan escrito, alcance autorizado. No conexiones, despliegue, gastos ni envíos.


## Resultado y revisión

- Núcleo completado: 13 pruebas de dominio/persistencia aprobadas; 2 de conexiones desactivadas aprobadas (`npm test`).
- UI completada: navegación móvil/escritorio, estados y edición progresiva; recursos locales, sin dependencias instaladas.
- Navegador Chromium: `tests/browser.mjs` y `tests/flows.mjs` aprobados. Recorridos, guardado tras recarga, archivo/deshacer, separación de espacios, XSS, exportación e importación en un contexto vacío.
- `tests/drafts.mjs` aprobado: conserva texto al guardar desde modal, advierte al salir/cambiar pestaña, permite Escape seguro y enfoca el contenido sin alterar la ruta.
- `tests/accessibility.mjs` aprobado: texto sobre fondos sólidos, botones de al menos 44 px y ausencia de desbordamiento en 9 pantallas por 3 anchos (360/430/1440 px). No equivale a auditoría WCAG integral ni prueba de Safari/Firefox.
- Puertos remotos y contratos añadidos después del molde y bloqueados. CSP impide conexiones de la app; la prueba básica de navegador observó cero solicitudes externas.
- Revisión independiente: cuatro hallazgos corregidos. El perfil no se reemplaza al importar; las fechas/estructuras anidadas se validan y se escapan números de versión; los borradores sobreviven a otras acciones; el enlace de salto al contenido no altera la ruta. Casos de regresión observados fallar y luego pasar.
- Se añadió edición de capacidades, señales y acciones con conservación de versiones previas; la nueva información sigue sin verificarse automáticamente.
- Sin hallazgos importantes pendientes en el alcance local revisado. Autenticación, backend, verificaciones de fuentes y servicios externos permanecen fuera del molde, según el alcance autorizado.
