export interface ICita {
  id: string;
  idCliente: string;
  horaCita: string; // formato ISO: 'YYYY-MM-DDTHH:mm:ss'
  estado: 'pendiente' | 'atendida' | 'cancelada';
}