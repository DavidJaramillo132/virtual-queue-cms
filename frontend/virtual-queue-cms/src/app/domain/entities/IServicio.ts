export interface IServicio {
  id: string;
  negocio_id: string;
  cita_id?: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  duracion_minutos?: number;
  capacidad?: number;
  visible: boolean;
}