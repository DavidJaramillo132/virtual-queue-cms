export interface ICita {
  id: string;
  usuario_id?: string;
  servicio_id?: string;
  fecha: Date;              // Fecha de la cita
  hora_inicio: string;      // Ej: "09:30"
  hora_fin: string;         // Ej: "10:00"
  estado: 'pendiente' | 'atendida' | 'cancelada';
  creado_en: Date;
}
