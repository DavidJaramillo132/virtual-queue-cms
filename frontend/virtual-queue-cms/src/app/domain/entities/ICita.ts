export interface ICita {
  id: string;
  cliente_id: string;
  negocio_id: string;
  estacion_id: string; // Requerido - cada cita debe estar en una fila (estación)
  servicio_id: string;
  fecha: Date;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente' | 'atendida' | 'cancelada';
  creadoEn?: Date;
}
