const { Client } = require('pg');

const applyCascade = async () => {
  const client = new Client({
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ahyeuobiaxqzezqubjox',
    password: 'J5SBRXQBNa2nVAU9',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Eliminar la restricción antigua
    console.log('🔧 Eliminando restricción antigua...');
    await client.query('ALTER TABLE citas DROP CONSTRAINT IF EXISTS fk_citas_servicio');

    // Crear la nueva restricción con CASCADE
    console.log('🔧 Creando nueva restricción con CASCADE...');
    await client.query('ALTER TABLE citas ADD CONSTRAINT fk_citas_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE');

    // Verificar que se creó correctamente
    console.log('🔍 Verificando restricción...');
    const result = await client.query(`
      SELECT rc.delete_rule 
      FROM information_schema.referential_constraints AS rc 
      WHERE rc.constraint_name = 'fk_citas_servicio'
    `);

    console.log('✅ Restricción actualizada correctamente');
    console.log('📋 Regla de eliminación:', result.rows[0]?.delete_rule);

    await client.end();
    console.log('\n✅ Script completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
};

applyCascade();
