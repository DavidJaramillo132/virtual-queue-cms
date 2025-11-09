// // Interfaces compartidas para el módulo AdminLocal

// export interface EstadisticasData {
//   totalCitas: number;
//   citasHoy: number;
//   tiempoEspera: number;
//   satisfaccion: number;
//   citasCompletadas: number;
//   citasCanceladas: number;
//   nuevosClientes: number;
// }

// export interface NegocioData {
//   id: number;
//   nombre: string;
//   categoria: string;
//   descripcion: string;
//   direccion: string;
//   telefono: string;
//   email: string;
// }

// export interface Servicio {
//   id: number;
//   nombre: string;
//   descripcion: string;
//   duracion: number;
//   precio?: number;
//   activo: boolean;
//   negocioId?: number;
// }

// export interface DiaHorario {
//   id?: number;
//   dia: string;
//   activo: boolean;
//   horaInicio: string;
//   horaFin: string;
//   negocioId?: number;
// }

// export type EstadoCita = 'confirmada' | 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

// export interface Cita {
//   id: number;
//   nombreCliente: string;
//   servicio: string;
//   fecha: string;
//   hora: string;
//   posicionFila: number;
//   estado: EstadoCita;
//   usuarioId?: number;
//   servicioId?: number;
//   negocioId?: number;
// }
