export interface INotificacion {
  id: string;
  idCliente: string;
  cita_id?: string;
  negocio_id?: string;
  tipo: 'cita_llamado' | 'cita_listo' | 'recordatorio';
  contenido?: any; // JSONB
  enviada_en?: string; // fecha-hora ISO
  estado: 'pendiente' | 'enviada' | 'fallida';
}