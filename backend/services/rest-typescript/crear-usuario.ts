import { AppDataSource } from './src/database/database';

async function crearUsuarioPrueba() {
  try {
    await AppDataSource.initialize();
    console.log('Conexión establecida');
    
    const result = await AppDataSource.query(`
      INSERT INTO usuarios (id, email, password, rol, nombre_completo, creado_en) 
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
      RETURNING id, email, rol, nombre_completo
    `, [
      '00000000-0000-0000-0000-000000000001',
      'cliente-prueba@test.com',
      'password123',
      'cliente',
      'Cliente de Prueba'
    ]);
    
    console.log('Usuario creado/actualizado:', JSON.stringify(result, null, 2));
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

crearUsuarioPrueba();
