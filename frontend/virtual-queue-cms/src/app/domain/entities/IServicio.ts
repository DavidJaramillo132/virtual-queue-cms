export interface IServicio {
  id: string;
  negocio_id: string;
  nombre: string;
  descripcion?: string;
  duracion_minutos: number;
  precio_centavos: number;
  creadoEn?: Date;
}