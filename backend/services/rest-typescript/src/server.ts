import express from 'express';
import { AppDataSource } from './infrastructure/database/data';
//import businessRoutes from './presentation/routes/businessRoutes';
import { config } from 'dotenv';
config();

const app = express();
/*
app.use(express.json());

app.use('/api/businesses', businessRoutes);
*/

// Inicializa la conexión a la base de datos y luego inicia el servidor
AppDataSource.initialize()
  .then(() => {
    console.log('📦 Conexión a Supabase (PostgreSQL) establecida');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Servidor REST corriendo en puerto ${process.env.PORT}`)
    );
  })
  .catch((error) => console.error('❌ Error al conectar con la base de datos:', error));
