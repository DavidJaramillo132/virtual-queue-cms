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

/*
Ejemplos de uso: Crear y eliminar un usuario

1) Crear usuario (registro) - endpoint público:

curl:
curl -X POST -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","apellido":"Pérez","email":"juan@example.com","password":"secreto"}' \
  http://localhost:3000/api/usuarios

PowerShell (Invoke-RestMethod):
Invoke-RestMethod -Uri "http://localhost:3000/api/usuarios" -Method Post -ContentType 'application/json' -Body (@{ nombre='Juan'; apellido='Pérez'; email='juan@example.com'; password='secreto' } | ConvertTo-Json)

Node (fetch):
await fetch('http://localhost:3000/api/usuarios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com', password: 'secreto' })
});


2) Eliminar usuario - requiere token JWT en Authorization header:

curl:
curl -X DELETE -H "Authorization: Bearer <TU_TOKEN_JWT>" http://localhost:3000/api/usuarios/<ID_DEL_USUARIO>

PowerShell:
>$headers = @{ Authorization = "Bearer <TU_TOKEN_JWT>" }
Invoke-RestMethod -Uri "http://localhost:3000/api/usuarios/<ID_DEL_USUARIO>" -Method Delete -Headers $headers

Node (fetch):
await fetch(`http://localhost:3000/api/usuarios/${userId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});

Reemplaza `<TU_TOKEN_JWT>` y `<ID_DEL_USUARIO>` por los valores reales. El middleware de autenticación espera el header en formato: "Authorization: Bearer <token>".
*/
