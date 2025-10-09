# Middlewares (src/presentation/middlewares)

Propósito
--
Middlewares son funciones que interceptan la petición/respuesta para realizar tareas transversales: autenticación, validación, logging, manejo de errores, etc.

Ejemplos
--
- `authMiddleware.ts` - verifica JWT y añade `req.user`.
- `errorHandler` - centraliza respuesta de errores.

Buenas prácticas
--
- Mantener middlewares pequeños y enfocados.
- No mezclar lógica cliente (localStorage/fetch) en middlewares del servidor.
