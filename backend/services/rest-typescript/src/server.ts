import express from 'express';
import cors from 'cors';
import { AppDataSource } from './database/database';
import { config } from 'dotenv';
config();

import usuarioRoutes from './presentation/routes/usuarioRoutes';
import negocioRoutes from './presentation/routes/negocioRoutes';
import estacionRoutes from './presentation/routes/estacionRoutes';
import horarioRoutes from './presentation/routes/horarioRoutes';
import servicioRoutes from './presentation/routes/servicioRoutes';
import citaRoutes from './presentation/routes/citaRoutes';
import adminSistemaRoutes from './presentation/routes/adminSistemaRoutes';
import adminGeneralRoutes from './presentation/routes/adminGeneralRoutes';

const app = express();

// Middleware para parsear JSON
app.use(express.json());

//  Middleware CORS - ¡importante que vaya antes de las rutas!
app.use(cors({
  origin: 'http://localhost:4200', // URL de tu frontend Angular
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true // si envías cookies o token
}));

// Inicializa la conexión a la base de datos
AppDataSource.initialize()
  .then(() => {
    console.log('Conexión a Supabase (PostgreSQL) establecida');

    // Rutas
    app.use('/api/usuarios', usuarioRoutes);
    app.use('/api/negocios', negocioRoutes);
    app.use('/api/estaciones', estacionRoutes);
    app.use('/api/horarios', horarioRoutes);
    app.use('/api/servicios', servicioRoutes);
    app.use('/api/citas', citaRoutes);
    app.use('/api/admins', adminSistemaRoutes);
    app.use('/api/admin', adminGeneralRoutes);

    // Inicia el servidor
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    app.listen(port, () => console.log(`Servidor REST corriendo en puerto ${port}`));
  })
  .catch((error) => console.error('Error al conectar con la base de datos:', error));
