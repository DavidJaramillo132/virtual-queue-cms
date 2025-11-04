import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IHorarioAtencion } from '../../domain/entities';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = 'http://localhost:3000/api/horarios-atencion';

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
   * Obtiene todos los horarios de atención
   */
  getAllHorarios(): Observable<IHorarioAtencion[]> {
    return this.http.get<IHorarioAtencion[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene horarios por estación
   */
  getHorariosByEstacion(estacionId: string): Observable<IHorarioAtencion[]> {
    return this.http.get<IHorarioAtencion[]>(`${this.apiUrl}?estacion_id=${estacionId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un horario por ID
   */
  getHorarioById(id: string): Observable<IHorarioAtencion> {
    const headers = this.getAuthHeaders();
    return this.http.get<IHorarioAtencion>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo horario de atención
   */
  createHorario(horario: Partial<IHorarioAtencion>): Observable<IHorarioAtencion> {
    const headers = this.getAuthHeaders();
    return this.http.post<IHorarioAtencion>(this.apiUrl, horario, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un horario existente
   */
  updateHorario(id: string, horario: Partial<IHorarioAtencion>): Observable<IHorarioAtencion> {
    const headers = this.getAuthHeaders();
    return this.http.put<IHorarioAtencion>(`${this.apiUrl}/${id}`, horario, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza múltiples horarios (batch update)
   */
  updateMultipleHorarios(horarios: Partial<IHorarioAtencion>[]): Observable<IHorarioAtencion[]> {
    const headers = this.getAuthHeaders();
    const promises = horarios.map(h => {
      if (h.id) {
        return this.updateHorario(h.id, h);
      } else {
        return this.createHorario(h);
      }
    });
    
    return new Observable(observer => {
      Promise.all(promises.map(p => p.toPromise()))
        .then(results => {
          observer.next(results.filter(r => r !== undefined) as IHorarioAtencion[]);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  /**
   * Elimina un horario
   */
  deleteHorario(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en HorarioService:', error);
    let errorMessage = 'Ocurrió un error en el servidor';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Código de error: ${error.status}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
