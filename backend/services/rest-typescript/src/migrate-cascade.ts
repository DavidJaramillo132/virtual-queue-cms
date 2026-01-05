import { AppDataSource } from './database/database';

async function updateCascadeConstraint() {
  try {
    await AppDataSource.initialize();
    console.log('🔌 Conectado a la base de datos');

    // Eliminar la restricción antigua
    await AppDataSource.query(`
      ALTER TABLE citas 
      DROP CONSTRAINT IF EXISTS fk_citas_servicio;
    `);
    console.log('✅ Restricción antigua eliminada');

    // Crear la nueva restricción con CASCADE
    await AppDataSource.query(`
      ALTER TABLE citas
      ADD CONSTRAINT fk_citas_servicio 
      FOREIGN KEY (servicio_id) 
      REFERENCES servicios(id) 
      ON DELETE CASCADE;
    `);
    console.log('✅ Nueva restricción con CASCADE creada');

    // Verificar
    const result = await AppDataSource.query(`
      SELECT
          tc.constraint_name,
          rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'citas'
          AND tc.constraint_name = 'fk_citas_servicio';
    `);
    
    console.log('📊 Restricción actualizada:', result);
    
    await AppDataSource.destroy();
    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

updateCascadeConstraint();
