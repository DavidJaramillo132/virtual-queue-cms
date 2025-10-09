# REST TypeScript Service

Microservicio REST escrito en TypeScript y TypeORM que forma parte del proyecto Virtual Queue CMS. Expone endpoints CRUD para las entidades del dominio: usuarios, negocios, estaciones, horarios de atención, servicios, citas, filas y administradores del sistema.

## Requisitos
- Node.js (>= 18 recomendado)
- npm
- PostgreSQL (o Supabase) accesible desde la máquina/entorno


## Variables de entorno
Crear un archivo `.env` en esta carpeta con las siguientes variables mínimas:

- `PORT` - puerto donde correrá el servicio (ej: 3000)
- `DB_HOST` - host de la base de datos (ej: db.example.com)
- `DB_PORT` - puerto de la base de datos (ej: 5432)
- `DB_USER` - usuario de la DB
- `DB_PASS` - contraseña de la DB
- `DB_NAME` - nombre de la base de datos
- `JWT_SECRET` - secreto para firmar y verificar JWTs

Ejemplo de `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=virtual_queue_dev
JWT_SECRET=mi_secreto_seguro
```

> Nota: `synchronize: true` está activado en `src/database/database.ts` para desarrollo. No lo uses en producción.

## Endpoints principales
Rutas montadas en `/api`:

- `/api/usuarios` — CRUD usuarios
- `/api/negocios` — CRUD negocios
- `/api/estaciones` — CRUD estaciones
- `/api/horarios` — CRUD horarios de atención
- `/api/servicios` — CRUD servicios
- `/api/citas` — CRUD citas
- `/api/filas` — CRUD filas
- `/api/admins` — CRUD administradores del sistema

Protección: la mayoría de las rutas (GET/PUT/DELETE) están protegidas por JWT mediante `authMiddleware`. El POST de creación quedó público por defecto (registro/creación). Ajusta según tus reglas de seguridad.

## Desarrollo y pruebas

1. Prueba de tipo (TypeScript):

```powershell
npx tsc --noEmit
```

2. Ejecutar el servicio en desarrollo:

```powershell
npm run dev
```

3. Consumir endpoints (ejemplo con curl):

```bash
# Crear usuario (público)
curl -X POST -H "Content-Type: application/json" -d '{"nombre":"Juan","email":"j@ej.com","password":"pass"}' http://localhost:3000/api/usuarios

# Listar usuarios (protegido - requiere Authorization)
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/usuarios
```

## Notas de seguridad y recomendaciones
- Asegura `JWT_SECRET` y no lo committees en el repositorio.
- Considera usar refresh tokens para sesiones largas.
- Desactiva `synchronize: true` en producción y usa migraciones con TypeORM.
- Añade validación de payload (zod / class-validator / express-validator) en controladores.
- Implementa control de roles si algunas operaciones solo deben ser realizadas por administradores.

## Próximos pasos sugeridos
- Añadir endpoints de autenticación (`/auth/login`) que firmen JWT y `/auth/refresh`.
- Añadir validaciones y tests (jest + supertest).
- Documentar swagger/openapi para facilitar uso por frontend.

---

Si quieres, puedo añadir el endpoint de `auth/login`, la tipificación global de `req.user`, o las validaciones de entrada ahora mismo.
