import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ICita } from '../../domain/entities';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = 'http://localhost:3000/api/citas';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el token JWT del localStorage
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Obtiene todas las citas
   */
  getAllCitas(): Observable<ICita[]> {
    return this.http.get<ICita[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene citas filtradas por estado
   */
  getCitasByEstado(estado: 'pendiente' | 'atendida' | 'cancelada'): Observable<ICita[]> {
    return this.http.get<ICita[]>(`${this.apiUrl}?estado=${estado}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene citas por usuario_id
   */
  getCitasByUsuario(usuarioId: string): Observable<ICita[]> {
    return this.http.get<ICita[]>(`${this.apiUrl}?usuario_id=${usuarioId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene citas por servicio_id
   */
  getCitasByServicio(servicioId: string): Observable<ICita[]> {
    return this.http.get<ICita[]>(`${this.apiUrl}?servicio_id=${servicioId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene una cita por ID
   */
  getCitaById(id: string): Observable<ICita> {
    const headers = this.getAuthHeaders();
    return this.http.get<ICita>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crea una nueva cita
   */
  createCita(cita: Partial<ICita>): Observable<ICita> {
    const headers = this.getAuthHeaders();
    return this.http.post<ICita>(this.apiUrl, cita, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza una cita existente
   */
  updateCita(id: string, cita: Partial<ICita>): Observable<ICita> {
    const headers = this.getAuthHeaders();
    return this.http.put<ICita>(`${this.apiUrl}/${id}`, cita, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza el estado de una cita
   */
  updateEstadoCita(id: string, estado: 'pendiente' | 'atendida' | 'cancelada'): Observable<ICita> {
    return this.updateCita(id, { estado });
  }

  /**
   * Elimina una cita
   */
  deleteCita(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en CitaService:', error);
    let errorMessage = 'Ocurrió un error en el servidor';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || `Código de error: ${error.status}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
