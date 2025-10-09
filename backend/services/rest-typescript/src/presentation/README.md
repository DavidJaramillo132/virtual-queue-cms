# Presentation (src/presentation)

Propósito
--
Esta carpeta contiene la capa de presentación / API: controllers que traducen peticiones HTTP a operaciones de negocio, rutas que exponen endpoints y middlewares (por ejemplo autenticación, validación).

Estructura
--
- `controller/` - controladores que contienen handlers para cada entidad (ej.: `UsuarioController.ts`).
- `routes/` - define las rutas y monta los controllers (ej.: `usuarioRoutes.ts`).
- `middlewares/` - middlewares reutilizables (auth, logging, validación).

Flujo típico
--
1. `routes` define la ruta y el middleware aplicable.
2. El `controller` recibe `req`, invoca el repositorio/servicio y responde.
3. `middlewares` como `authMiddleware` validan la petición antes de llegar al controller.

Buenas prácticas
--
- Mantén controllers finos: la lógica de negocio va en services o repositorios.
- Usa middleware para preocupaciones transversales (auth, validación, logging).
- Valida entrada (por ejemplo con `class-validator` o `zod`) antes de llamar a repositorio.
