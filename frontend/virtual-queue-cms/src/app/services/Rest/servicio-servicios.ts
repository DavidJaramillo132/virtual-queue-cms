import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { IServicio } from '../../domain/entities';

@Injectable({
  providedIn: 'root'
})
export class ServicioServicios {
  private apiUrl = 'http://localhost:3000/api/servicios';

  constructor(private http: HttpClient, private router: Router) {}

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
   * Obtiene todos los servicios
   */
  getAllServicios(): Observable<IServicio[]> {
    return this.http.get<IServicio[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene servicios por negocio
   */
  getServiciosByNegocio(negocioId: string): Observable<IServicio[]> {
    return this.http.get<IServicio[]>(`${this.apiUrl}?negocio_id=${negocioId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un servicio por ID
   */
  getServicioById(id: string): Observable<IServicio> {
    return this.http.get<IServicio>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo servicio
   */
  agregarServicio(servicio: Partial<IServicio>): Observable<IServicio> {
    const headers = this.getAuthHeaders();
    return this.http.post<IServicio>(this.apiUrl, servicio, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un servicio existente
   */
  actualizarServicio(id: string, servicio: Partial<IServicio>): Observable<IServicio> {
    const headers = this.getAuthHeaders();
    return this.http.put<IServicio>(`${this.apiUrl}/${id}`, servicio, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un servicio
   */
  eliminarServicio(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en ServicioServicios:', error);
    let errorMessage = 'Ocurrió un error en el servidor';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Código de error: ${error.status}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
