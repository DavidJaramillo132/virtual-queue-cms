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

  /**
   * Obtiene negocios con premium ordenados primero
   */
  getNegociosConPremiumPrimero(): Observable<INegocio[]> {
    return this.http.get(`${this.apiUrl}?premium_first=true`) as Observable<INegocio[]>;
  }

  /**
   * Obtiene solo negocios premium
   */
  getNegociosPremium(): Observable<INegocio[]> {
    return this.http.get(`${this.apiUrl}/premium`) as Observable<INegocio[]>;
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

  // Subir imagen del negocio
  uploadImagen(negocioId: string, formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
      // NO establecer Content-Type para FormData, el navegador lo hace automáticamente
    });
    return this.http.post(`${this.apiUrl}/${negocioId}/imagen`, formData, { headers });
  }

  // Eliminar un negocio
  deleteNegocio(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}
