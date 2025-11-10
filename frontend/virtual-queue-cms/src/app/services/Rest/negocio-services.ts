import { Injectable } from '@angular/core';
import { INegocio, IServicio } from '../../domain/entities';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class NegocioServices {

  private apiUrl = 'http://localhost:3000/api/negocios'; // URL de la API

  constructor(private http: HttpClient, private router: Router) { }

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

  getNegocios(): Observable<INegocio[]> {
    return this.http.get(this.apiUrl) as Observable<INegocio[]>;
  }

  getNegocioById(id: string): Observable<INegocio> {
    return this.http.get(`${this.apiUrl}/${id}`) as Observable<INegocio>;
  }

  getServiciosByNegocio(negocioId: string): Observable<IServicio[]> {
    return this.http.get(`http://localhost:3000/api/servicios?negocio_id=${negocioId}`) as Observable<IServicio[]>;
  }

  // Crear un nuevo negocio
  createNegocio(negocioData: Partial<INegocio>): Observable<INegocio> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl, negocioData, { headers }) as Observable<INegocio>;
  }

  // Actualizar un negocio existente
  updateNegocio(id: string, negocioData: Partial<INegocio>): Observable<INegocio> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/${id}`, negocioData, { headers }) as Observable<INegocio>;
  }

  // Eliminar un negocio
  deleteNegocio(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}
