import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface CrearPagoRequest {
  negocio_id: string;
  usuario_id: string;
  monto: number;
  moneda: string;
  tipo: 'suscripcion' | 'servicio' | 'cita';
  descripcion?: string;
  metadatos?: Record<string, any>;
}

export interface PagoResponse {
  id: string;
  negocio_id: string;
  usuario_id: string;
  monto: number;
  moneda: string;
  estado: 'pendiente' | 'completado' | 'fallido' | 'cancelado' | 'procesando';
  tipo: string;
  pasarela: string;
  id_transaccion_externa?: string;
  url_checkout?: string;
  descripcion?: string;
  metadatos?: Record<string, any>;
  creado_en: string;
  actualizado_en: string;
}

export interface VerificarPagoResponse {
  id: string;
  estado: string;
  monto: number;
  moneda: string;
  pasarela: string;
  metadatos?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private apiUrl = `${environment.paymentServiceUrl}/pagos`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Crea un nuevo pago
   */
  crearPago(request: CrearPagoRequest): Observable<PagoResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<PagoResponse>(this.apiUrl, request, { headers });
  }

  /**
   * Verifica el estado de un pago
   */
  verificarPago(pagoId: string): Observable<VerificarPagoResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<VerificarPagoResponse>(`${this.apiUrl}/${pagoId}`, { headers });
  }

  /**
   * Obtiene la configuración de Stripe (clave pública)
   */
  obtenerConfiguracionStripe(): Observable<{ publishable_key: string }> {
    return this.http.get<{ publishable_key: string }>(`${environment.paymentServiceUrl}/config/stripe`);
  }
}
