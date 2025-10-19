
import { IHorarioAtencion } from './IHorarioAtencion';
import { IEstacion } from './IEstacion';

export interface INegocio {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  telefono: string;
  correo?: string; 
  imagen_url: string;
  estado: boolean;
  horaDeAtencion: IHorarioAtencion[];
  estacion: IEstacion[];
}



