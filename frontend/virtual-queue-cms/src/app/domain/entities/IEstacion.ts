export interface IEstacion {
  id: string;
  negocio_id: string;
  nombre: string;
  tipo?: string;
  estado: 'activa' | 'inactiva';
  creadoEn?: Date;
}