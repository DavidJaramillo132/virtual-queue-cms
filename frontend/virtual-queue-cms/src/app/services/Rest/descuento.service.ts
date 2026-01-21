import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface IDescuento {
  id: string;
  tipo: string;
  porcentaje: number;
  evento_origen: string;
  fecha_aplicado: string;
  fecha_expiracion: string | null;
  metadata: Record<string, any>;
}

export interface IDescuentoStats {
  total_descuentos: number;
  descuentos_activos: number;
  por_tipo: Record<string, { total: number; activos: number }>;
  usuarios_con_descuento: number;
}

@Injectable({
  providedIn: 'root'
})
export class DescuentoService {

  private apiUrl = `${environment.paymentServiceUrl}/descuentos`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene los descuentos activos de un usuario
   */
  obtenerDescuentosUsuario(usuarioId: string): Observable<{
    usuario_id: string;
    total_descuentos: number;
    descuentos: IDescuento[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  /**
   * Reclama descuentos pendientes por email
   */
  reclamarDescuentosPendientes(usuarioId: string, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reclamar`, { usuario_id: usuarioId, email });
  }

  /**
   * Obtiene las estadísticas generales de descuentos
   */
  obtenerEstadisticas(): Observable<IDescuentoStats> {
    return this.http.get<IDescuentoStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Calcula el precio con descuento
   */
  calcularPrecioConDescuento(precioOriginal: number, descuentos: IDescuento[]): {
    precioFinal: number;
    descuentoAplicado: IDescuento | null;
    porcentajeTotal: number;
  } {
    if (!descuentos || descuentos.length === 0) {
      return {
        precioFinal: precioOriginal,
        descuentoAplicado: null,
        porcentajeTotal: 0
      };
    }

    // Usar el descuento con mayor porcentaje
    const mejorDescuento = descuentos.reduce((mejor, actual) =>
      actual.porcentaje > mejor.porcentaje ? actual : mejor
    );

    const precioFinal = precioOriginal * (1 - mejorDescuento.porcentaje / 100);

    return {
      precioFinal: Math.round(precioFinal * 100) / 100, // Redondear a 2 decimales
      descuentoAplicado: mejorDescuento,
      porcentajeTotal: mejorDescuento.porcentaje
    };
  }
}
