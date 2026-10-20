# Integraciones: preparadas, desactivadas

Este archivo se añadió al final del trabajo del molde. No se ha conectado ningún servicio. No se creó una API de servidor ni se implementó autenticación ficticia.

## Fronteras existentes

- `src/domain.js`: reglas, transiciones y validación, independientes de la UI y del transporte.
- `src/store.js`: repositorio local. `getState()`, `dispatch(command)`, `switchSpace(name)`, `export()`, `import(raw)`, `subscribe(listener)`.
- `src/integrations.js`: tipos documentados de evidencia y observación; `remoteGateway.discover`, `getDetail`, `revalidate`, `authenticate` rechazan con `CONNECTIONS_DISABLED` sin realizar solicitudes. El gateway no está conectado a la interfaz ni es activable desde preferencias.
- `server.mjs`: únicamente servidor estático ligado a `127.0.0.1`; CSP `connect-src 'none'`, sin rutas API ni secretos.

## Correspondencia para una futura API

| Operación local | Futuro contrato | Requisitos antes de sustituirla |
|---|---|---|
| `opportunity.add` | POST `/api/v1/intake` | Sesión real, autorización, idempotencia, validación de tamaño; ingreso a revisión |
| `opportunity.edit` | PATCH o revisión del expediente | If-Match/ETag; evidencia declarada no comprobada |
| `opportunity.save`, archivo/restauración | Decisión y transición del expediente | Propietario validado, auditoría y conservación |
| `proposal.add`, `proposal.version` | Propuesta y versiones | Versiones inmutables; nunca envío implícito |
| `work.add`, `work.agreement`, entregables | Trabajo, acuerdo y entregable | Transacción, aceptación y guardas de estado |
| `payment.add` | Movimiento de cobro | Idempotencia durable, importe en unidades menores y misma moneda |
| `action.add`, `action.toggle` | Acción y recordatorio interno | Deduplicación y cancelación por resolución |
| `profile.save`, `skill.add` | Perfil versionado/capacidades | No inferir capacidades demostradas; evidencias por revisar |
| `discover/detail/revalidate` | Adaptador específico de fuente | Permiso propio, términos, cuotas, SSRF y pipeline idempotente |

La especificación Lápiz original conserva el diseño detallado; esta implementación no pretende haberlo ejecutado íntegro. El molde simplifica deliberadamente el modelo al estado local que usa la UI.

## Orden de integración posterior

1. Acordar proveedor gratuito, identidad personal, permisos y destino de respaldo. Definir migración explícita del espacio personal; jamás importar ejemplos como producción.
2. Implementar API privada y autorización por entidad. Reemplazar persistencia local por un repositorio asíncrono sin cambiar el dominio; adaptar la UI a esperas reales, errores tipados y conflictos. La API debe repetir toda validación: el navegador no es autoridad.
3. Implementar backend durable, versiones y transacciones. La comprobación de otra pestaña en localStorage no es bloqueo distribuido ni sustituto de idempotencia de servidor.
4. Incorporar evidencia real, fechas, TTL y reglas aprobadas. El molde no tiene un botón que vuelva «verificada» una oportunidad por sí solo.
5. Integrar una fuente autorizada a la vez. Correr tareas fuera del celular con cuotas y reintentos limitados; probar captura y revalidación antes de habilitarla.
6. Diseñar respaldo/restauración de servidor y protección de datos privados. Solo entonces revisar el modo offline y sincronización; este molde no los implementa.
7. Correo/push/envíos/compras siguen fuera de alcance hasta autorización separada. No existe endpoint de envío en esta versión.

Cambiar CSP, añadir credenciales, URLs operativas o transporte HTTP requiere un nuevo alcance autorizado. No hay archivos `.env` con credenciales ficticias ni llaves que rellenar accidentalmente.

## Respuestas y errores esperados

La UI futura debe distinguir 401 (sesión), 403 (permiso), 409/412 (conflicto), 422 (validación), 429 (límite) y 503 (fuente/servicio), conservar el formulario y mostrar un próximo paso. Una fuente caída no devuelve lista vacía como éxito. Datos importados o copiados siempre se consideran no verificados.

## Lo que Admin podrá completar

Servicios y evidencias, disponibilidad, idiomas, encargos, hipótesis, textos de propuestas, acuerdos y siguientes pasos ya se rellenan en la UI. Identidad de producción, políticas de admisión, permisos de fuentes, backend, respaldos remotos y criterios de correo siguen pendientes. No habilitar conexiones copiando un token en el navegador.
