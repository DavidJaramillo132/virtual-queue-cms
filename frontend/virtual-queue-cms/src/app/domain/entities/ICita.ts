export interface ICita {
  id: string;
  cliente_id: string;
  negocio_id: string;
  estacion_id?: string;
  servicio_id: string;
  fecha: Date;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente' | 'atendida' | 'cancelada';
  creadoEn?: Date;
}
