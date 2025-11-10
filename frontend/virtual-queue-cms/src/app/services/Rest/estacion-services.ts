import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IEstacion } from '../../domain/entities';

@Injectable({
  providedIn: 'root'
})
export class EstacionServices {
  private apiUrl = 'http://localhost:3000/api/estaciones';

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
   * Obtiene todas las estaciones
   */
  getAllEstaciones(): Observable<IEstacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<IEstacion[]>(this.apiUrl, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene estaciones por negocio
   */
  getEstacionesByNegocio(negocioId: string): Observable<IEstacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<IEstacion[]>(`${this.apiUrl}/negocio/${negocioId}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene una estación por ID
   */
  getEstacionById(id: string): Observable<IEstacion> {
    const headers = this.getAuthHeaders();
    return this.http.get<IEstacion>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crea una nueva estación
   */
  createEstacion(estacionData: Partial<IEstacion>): Observable<IEstacion> {
    const headers = this.getAuthHeaders();
    return this.http.post<IEstacion>(this.apiUrl, estacionData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza una estación existente
   */
  updateEstacion(id: string, estacionData: Partial<IEstacion>): Observable<IEstacion> {
    const headers = this.getAuthHeaders();
    return this.http.put<IEstacion>(`${this.apiUrl}/${id}`, estacionData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una estación
   */
  deleteEstacion(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en EstacionServices:', error);
    let errorMessage = 'Ocurrió un error en el servidor';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Código de error: ${error.status}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
