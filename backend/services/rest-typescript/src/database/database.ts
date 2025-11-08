import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

import { Usuario, Negocio, Estacion, HorarioAtencion, Servicio, Cita, AdminSistema } from '../entities/index';



config(); // Carga las variables del .env

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false, // ⚠️ IMPORTANTE: Cambiado a false para no sobrescribir tu base de datos
  ssl: { rejectUnauthorized: false }, // Requerido por Supabase
  logging: false,
  entities: [Usuario, Negocio, Estacion, HorarioAtencion, Servicio, Cita, AdminSistema],
});
