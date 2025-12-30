import { AppDataSource } from './backend/services/rest-typescript/src/database/database';

async function checkUsuarios() {
  await AppDataSource.initialize();
  const usuarios = await AppDataSource.query('SELECT id, nombre_completo, email, rol FROM usuarios LIMIT 10');
  console.log('Usuarios encontrados:', JSON.stringify(usuarios, null, 2));
  await AppDataSource.destroy();
}

checkUsuarios();
