# Database (src/database)

Propósito
--
Contiene la configuración de conexión a la base de datos (TypeORM DataSource). Aquí se inicializa `AppDataSource` usado por repositorios.

Archivo principal
--
- `database.ts`: exporta `AppDataSource` configurado con las entidades y parámetros tomados desde variables de entorno.

Variables de entorno típicas
--
- `DB_HOST` - host de la base de datos
- `DB_PORT` - puerto (ej. 5432)
- `DB_USERNAME` - usuario
- `DB_PASSWORD` - contraseña
- `DB_DATABASE` - nombre de la base de datos
- `NODE_ENV` - para distinguir entornos
- `DATABASE_URL` - en despliegues como Heroku/Supabase puede usarse una URL

Notas importantes
--
- `synchronize: true` es conveniente en desarrollo, pero puede ser peligroso en producción (puede perder datos). Para producción usa migraciones.
- Si te conectas a un proveedor que requiere SSL (por ejemplo Supabase), comprueba `ssl: { rejectUnauthorized: false }` o la configuración apropiada.

Ejemplo de inicialización
--
import { DataSource } from 'typeorm';
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [/* ... */],
  synchronize: true,
});
