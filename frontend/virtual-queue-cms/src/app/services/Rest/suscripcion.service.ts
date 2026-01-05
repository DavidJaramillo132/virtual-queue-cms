import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISuscripcion, IVerificarPremium, IPlanSuscripcion } from '../../domain/entities/INegocio';
import { environment } from '../../environment/environment';

export interface CrearSuscripcionRequest {
  usuario_id: string;
  tipo?: 'basico' | 'premium' | 'enterprise';
  con_prueba_gratis?: boolean;
}

export interface CancelarSuscripcionRequest {
  suscripcion_id: string;
  razon?: string;
  cancelar_inmediatamente?: boolean;
}

export interface PlanesInfoResponse {
  planes: IPlanSuscripcion[];
}

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {

  private apiUrl = `${environment.paymentServiceUrl}/suscripciones`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Crea una nueva suscripcion premium para un usuario
   */
  crearSuscripcion(request: CrearSuscripcionRequest): Observable<ISuscripcion> {
    const headers = this.getAuthHeaders();
    return this.http.post<ISuscripcion>(this.apiUrl, request, { headers });
  }

  /**
   * Obtiene la suscripcion de un usuario
   */
  obtenerSuscripcionPorUsuario(usuarioId: string): Observable<ISuscripcion> {
    return this.http.get<ISuscripcion>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  /**
   * Verifica si un usuario tiene suscripcion premium activa
   */
  verificarPremium(usuarioId: string): Observable<IVerificarPremium> {
    return this.http.get<IVerificarPremium>(`${this.apiUrl}/usuario/${usuarioId}/verificar`);
  }

  /**
   * Cancela una suscripcion
   */
  cancelarSuscripcion(request: CancelarSuscripcionRequest): Observable<ISuscripcion> {
    const headers = this.getAuthHeaders();
    return this.http.post<ISuscripcion>(`${this.apiUrl}/cancelar`, request, { headers });
  }

  /**
   * Obtiene la lista de IDs de usuarios premium
   */
  obtenerUsuariosPremium(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/premium/usuarios`);
  }

  /**
   * Obtiene informacion sobre los planes de suscripcion disponibles
   */
  obtenerInfoPlanes(): Observable<PlanesInfoResponse> {
    return this.http.get<PlanesInfoResponse>(`${this.apiUrl}/planes/info`);
  }

  /**
   * Renueva una suscripcion manualmente
   */
  renovarSuscripcion(suscripcionId: string): Observable<ISuscripcion> {
    const headers = this.getAuthHeaders();
    return this.http.post<ISuscripcion>(`${this.apiUrl}/${suscripcionId}/renovar`, {}, { headers });
  }
}
