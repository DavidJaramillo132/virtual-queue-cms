import { ICita } from './ICita';

export interface IFila {
  id: string;
  idCita: string;
  date: string; // formato 'YYYY-MM-DD'
  startTime: string;
  state: 'abierta' | 'cerrada';
  cita: ICita[];
}