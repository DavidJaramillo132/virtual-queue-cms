import express from 'express';
import { AppDataSource } from './database/database';
//import businessRoutes from './presentation/routes/businessRoutes';
import jwt from 'jsonwebtoken';


import { config } from 'dotenv';
config();

const app = express();
app.use(express.json());
import usuarioRoutes from './presentation/routes/usuarioRoutes';
import negocioRoutes from './presentation/routes/negocioRoutes';
import estacionRoutes from './presentation/routes/estacionRoutes';
import horarioRoutes from './presentation/routes/horarioRoutes';
import servicioRoutes from './presentation/routes/servicioRoutes';
import citaRoutes from './presentation/routes/citaRoutes';
import filaRoutes from './presentation/routes/filaRoutes';
import adminSistemaRoutes from './presentation/routes/adminSistemaRoutes';
/*
app.use(express.json());

app.use('/api/businesses', businessRoutes);
*/

// Inicializa la conexión a la base de datos y luego inicia el servidor
AppDataSource.initialize()
  .then(() => {
    console.log('Conexión a Supabase (PostgreSQL) establecida');
    app.use('/api/usuarios', usuarioRoutes);
    app.use('/api/negocios', negocioRoutes);
    app.use('/api/estaciones', estacionRoutes);
    app.use('/api/horarios', horarioRoutes);
    app.use('/api/servicios', servicioRoutes);
    app.use('/api/citas', citaRoutes);
    app.use('/api/filas', filaRoutes);
    app.use('/api/admins', adminSistemaRoutes);
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    app.listen(port, () =>
      console.log(`Servidor REST corriendo en puerto ${port}`)

    );
    // prueba de token y usuario
    // llamar usuario por id y generar token
    const userId = 'dd5a7684-5d96-4f7e-87ad-a9e74fb0f341'; // reemplaza con el ID real

    jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      //{ expiresIn: '1h' } as SignOptions, // opcional, pero recomendable
      (err: Error | null, token?: string) => {
        if (err) {
          console.error('Error al generar el token JWT:', err);
          return;
        }
        console.log('Token JWT generado:', token);
      }
    );

  })
  .catch((error) => console.error('Error al conectar con la base de datos:', error));
