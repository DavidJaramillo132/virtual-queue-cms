export interface IEstacion {
  id: string;
  idNegocio: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
}