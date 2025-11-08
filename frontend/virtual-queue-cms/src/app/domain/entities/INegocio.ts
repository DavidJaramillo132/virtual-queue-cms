export interface INegocio {
  id: string;
  admin_negocio_id?: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  imagen_url?: string;
  estado: boolean;
  horario_general?: string;
  creadoEn?: Date;
}



