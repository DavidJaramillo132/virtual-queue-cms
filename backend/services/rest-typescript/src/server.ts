import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { AppDataSource } from './database/database';
import { config } from 'dotenv';
config();

import usuarioRoutes from './presentation/routes/usuarioRoutes';
import negocioRoutes from './presentation/routes/negocioRoutes';
import estacionRoutes from './presentation/routes/estacionRoutes';
import horarioRoutes from './presentation/routes/horarioRoutes';
import servicioRoutes from './presentation/routes/servicioRoutes';
import citaRoutes from './presentation/routes/citaRoutes';
import filaRoutes from './presentation/routes/filaRoutes';
import adminSistemaRoutes from './presentation/routes/adminSistemaRoutes';

const app = express();

// 1️⃣ Middleware para parsear JSON
app.use(express.json());

// 2️⃣ Middleware CORS - ¡importante que vaya antes de las rutas!
app.use(cors({
  origin: 'http://localhost:4200', // URL de tu frontend Angular
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true // si envías cookies o token
}));

// Inicializa la conexión a la base de datos
AppDataSource.initialize()
  .then(() => {
    console.log('Conexión a Supabase (PostgreSQL) establecida');

    // 3️⃣ Rutas
    app.use('/api/usuarios', usuarioRoutes);
    app.use('/api/negocios', negocioRoutes);
    app.use('/api/estaciones', estacionRoutes);
    app.use('/api/horarios', horarioRoutes);
    app.use('/api/servicios', servicioRoutes);
    app.use('/api/citas', citaRoutes);
    app.use('/api/filas', filaRoutes);
    app.use('/api/admins', adminSistemaRoutes);

    // 4️⃣ Inicia el servidor
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    app.listen(port, () => console.log(`Servidor REST corriendo en puerto ${port}`));

    // 5️⃣ Prueba de token JWT
    const userId = 'dd5a7684-5d96-4f7e-87ad-a9e74fb0f341'; // reemplaza con el ID real
    jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
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
