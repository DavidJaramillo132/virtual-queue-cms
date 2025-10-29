import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

// Interfaces para los datos
export interface EstadisticasData {
  totalCitas: number;
  citasHoy: number;
  tiempoEspera: number;
  satisfaccion: number;
  citasCompletadas: number;
  citasCanceladas: number;
  nuevosClientes: number;
}

export interface NegocioData {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio?: number;
  activo: boolean;
  negocioId?: number;
}

export interface DiaHorario {
  id?: number;
  dia: string;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
  negocioId?: number;
}

export interface Cita {
  id: number;
  nombreCliente: string;
  servicio: string;
  fecha: string;
  hora: string;
  posicionFila: number;
  estado: 'confirmada' | 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  usuarioId?: number;
  servicioId?: number;
  negocioId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminLocalService {
  // TODO: Inyectar HttpClient cuando se conecte a la API
  // constructor(private http: HttpClient) {}

  // Endpoints de la API (configurar según tu backend)
  private readonly API_URL = 'http://localhost:3000/api'; // Cambiar según tu configuración

  // ==================== ESTADÍSTICAS ====================
  
  /**
   * Obtiene las estadísticas del negocio
   * TODO: Conectar con endpoint GET /estadisticas/:negocioId
   */
  getEstadisticas(negocioId: number): Observable<EstadisticasData> {
    // TODO: Implementar
    // return this.http.get<EstadisticasData>(`${this.API_URL}/estadisticas/${negocioId}`);
    
    // Mock data temporal
    return of({
      totalCitas: 156,
      citasHoy: 12,
      tiempoEspera: 15,
      satisfaccion: 4.5,
      citasCompletadas: 142,
      citasCanceladas: 8,
      nuevosClientes: 23
    });
  }

  // ==================== NEGOCIO ====================
  
  /**
   * Obtiene la información del negocio
   * TODO: Conectar con endpoint GET /negocio/:id
   */
  getNegocio(negocioId: number): Observable<NegocioData> {
    // TODO: Implementar
    // return this.http.get<NegocioData>(`${this.API_URL}/negocio/${negocioId}`);
    
    // Mock data temporal
    return of({
      id: 1,
      nombre: 'Restaurante El Buen Sabor',
      categoria: 'Restaurante',
      descripcion: 'Comida tradicional y deliciosa',
      direccion: 'Calle Principal 123',
      telefono: '555-0101',
      email: 'contacto@buensabor.com'
    });
  }

  /**
   * Actualiza la información del negocio
   * TODO: Conectar con endpoint PUT /negocio/:id
   */
  updateNegocio(negocio: NegocioData): Observable<NegocioData> {
    // TODO: Implementar
    // return this.http.put<NegocioData>(`${this.API_URL}/negocio/${negocio.id}`, negocio);
    
    // Mock temporal
    return of(negocio);
  }

  // ==================== SERVICIOS ====================
  
  /**
   * Obtiene todos los servicios de un negocio
   * TODO: Conectar con endpoint GET /servicios?negocioId=:id
   */
  getServicios(negocioId: number): Observable<Servicio[]> {
    // TODO: Implementar
    // return this.http.get<Servicio[]>(`${this.API_URL}/servicios?negocioId=${negocioId}`);
    
    // Mock data temporal
    return of([
      {
        id: 1,
        nombre: 'Reserva de Mesa',
        descripcion: 'Reserva tu mesa con anticipación',
        duracion: 90,
        precio: 0,
        activo: true
      },
      {
        id: 2,
        nombre: 'Consulta General',
        descripcion: 'Revisión general de tu mascota',
        duracion: 30,
        precio: 25,
        activo: true
      }
    ]);
  }

  /**
   * Crea un nuevo servicio
   * TODO: Conectar con endpoint POST /servicios
   */
  createServicio(servicio: Servicio): Observable<Servicio> {
    // TODO: Implementar
    // return this.http.post<Servicio>(`${this.API_URL}/servicios`, servicio);
    
    // Mock temporal
    return of(servicio);
  }

  /**
   * Actualiza un servicio existente
   * TODO: Conectar con endpoint PUT /servicios/:id
   */
  updateServicio(servicio: Servicio): Observable<Servicio> {
    // TODO: Implementar
    // return this.http.put<Servicio>(`${this.API_URL}/servicios/${servicio.id}`, servicio);
    
    // Mock temporal
    return of(servicio);
  }

  /**
   * Elimina un servicio
   * TODO: Conectar con endpoint DELETE /servicios/:id
   */
  deleteServicio(servicioId: number): Observable<void> {
    // TODO: Implementar
    // return this.http.delete<void>(`${this.API_URL}/servicios/${servicioId}`);
    
    // Mock temporal
    return of(undefined);
  }

  // ==================== HORARIOS ====================
  
  /**
   * Obtiene los horarios de atención de un negocio
   * TODO: Conectar con endpoint GET /horarios?negocioId=:id
   */
  getHorarios(negocioId: number): Observable<DiaHorario[]> {
    // TODO: Implementar
    // return this.http.get<DiaHorario[]>(`${this.API_URL}/horarios?negocioId=${negocioId}`);
    
    // Mock data temporal
    return of([
      { dia: 'Domingo', activo: false, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Lunes', activo: true, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Martes', activo: true, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Miércoles', activo: true, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Jueves', activo: true, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Viernes', activo: true, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Sábado', activo: false, horaInicio: '09:00', horaFin: '18:00' }
    ]);
  }

  /**
   * Actualiza los horarios de atención
   * TODO: Conectar con endpoint PUT /horarios/:negocioId
   */
  updateHorarios(negocioId: number, horarios: DiaHorario[]): Observable<DiaHorario[]> {
    // TODO: Implementar
    // return this.http.put<DiaHorario[]>(`${this.API_URL}/horarios/${negocioId}`, horarios);
    
    // Mock temporal
    return of(horarios);
  }

  // ==================== CITAS ====================
  
  /**
   * Obtiene todas las citas de un negocio
   * TODO: Conectar con endpoint GET /citas?negocioId=:id
   */
  getCitas(negocioId: number, filtro?: string): Observable<Cita[]> {
    // TODO: Implementar
    // const params = filtro ? `?estado=${filtro}` : '';
    // return this.http.get<Cita[]>(`${this.API_URL}/citas/${negocioId}${params}`);
    
    // Mock data temporal
    return of([
      {
        id: 1,
        nombreCliente: 'María García',
        servicio: 'Consulta General',
        fecha: '2024-01-15',
        hora: '10:00',
        posicionFila: 1,
        estado: 'confirmada'
      },
      {
        id: 2,
        nombreCliente: 'Juan Pérez',
        servicio: 'Vacunación',
        fecha: '2024-01-15',
        hora: '10:30',
        posicionFila: 2,
        estado: 'pendiente'
      }
    ]);
  }

  /**
   * Actualiza el estado de una cita
   * TODO: Conectar con endpoint PATCH /citas/:id/estado
   */
  updateEstadoCita(citaId: number, estado: string): Observable<Cita> {
    // TODO: Implementar
    // return this.http.patch<Cita>(`${this.API_URL}/citas/${citaId}/estado`, { estado });
    
    // Mock temporal
    return of({} as Cita);
  }

  /**
   * Cancela una cita
   * TODO: Conectar con endpoint DELETE /citas/:id
   */
  cancelarCita(citaId: number): Observable<void> {
    // TODO: Implementar
    // return this.http.delete<void>(`${this.API_URL}/citas/${citaId}`);
    
    // Mock temporal
    return of(undefined);
  }
}
