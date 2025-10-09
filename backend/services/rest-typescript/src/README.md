# Backend REST (src)

Este directorio contiene el servicio REST TypeScript del proyecto.

Estructura principal
--
- `database/` - configuración y inicialización de TypeORM (`AppDataSource`).
- `entities/` - entidades TypeORM que modelan la base de datos.
- `repository/` - capa de acceso a datos (repositorios que usan `AppDataSource`).
- `presentation/` - capa API: controllers, rutas y middlewares.
- `server.ts` - punto de entrada del servidor Express.

Primeros pasos (desarrollo)
--
1. Copia el fichero de ejemplo de variables de entorno o crea un `.env` con las siguientes variables mínimas:

- `PORT` - puerto (ej. 3000)
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` - configuración de la DB
- `JWT_SECRET` - secreto para firmar tokens JWT

2. Instala dependencias:

```powershell
npm install
```

3. Ejecuta en modo desarrollo:

```powershell
npm run dev
```

Notas y enlaces útiles
--
- Para entender cómo interactúan las partes mira los README de cada subcarpeta:
  - `database/README.md`
  - `entities/README.md`
  - `repository/README.md`
  - `presentation/README.md` (y los READMEs dentro de `presentation/controller`, `presentation/routes`, `presentation/middlewares`)
- En desarrollo `synchronize: true` puede estar activado en `database.ts`. Evita usarlo en producción; usa migraciones.
- Asegúrate de configurar correctamente `JWT_SECRET` para las rutas protegidas por `authMiddleware`.

¿Quieres que añada un `sample.env` o un script `npm run start:prod` y `npm run migrate` para producción? Puedo generar esos archivos si lo deseas.
