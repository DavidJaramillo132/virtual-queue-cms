
import { IHorarioAtencion } from './IHorarioAtencion';
import { IEstacion } from './IEstacion';

export interface INegocio {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  ubicacion: string; // google map api
  telefono: string;
  correo?: string; 
  imagen_url: string;
  estado: boolean;
  horaDeAtencion: IHorarioAtencion[];
  estacion: IEstacion[];
}