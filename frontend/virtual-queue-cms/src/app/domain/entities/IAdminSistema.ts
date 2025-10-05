import { INegocio } from './INegocio';
// iadmin-sistema.ts
export interface IAdminSistema {
  id: string;
  idNegocio: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  negocio: INegocio[];
}