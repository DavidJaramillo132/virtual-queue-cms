export interface IHorarioAtencion {
  id: string;
  estacion_id: string;
  dia_semana: number; // 0-6 (Domingo a Sábado)
  hora_inicio: string;
  hora_fin: string;
  creadoEn?: Date;
}