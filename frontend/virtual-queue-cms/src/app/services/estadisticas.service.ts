import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebsocketService } from './websocket.service';

export interface Estadisticas {
  negocio_id: string;
  citas_hoy: number;
  total_citas: number;
  citas_completadas: number;
  citas_canceladas: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  constructor(private websocketService: WebsocketService) {}

  /**
   * Conecta al WebSocket y se suscribe a las estadísticas de un negocio
   * @param token Token JWT para autenticación
   * @param negocioId ID del negocio
   * @returns Observable con las estadísticas en tiempo real
   */
  obtenerEstadisticasEnTiempoReal(token: string, negocioId: string): Observable<Estadisticas> {
    // Conectar al WebSocket si no está conectado
    if (!this.websocketService.isSocketConnected()) {
      this.websocketService.connect(token);
    }

    // Suscribirse al canal de estadísticas del negocio
    const channel = `estadisticas:${negocioId}`;
    this.websocketService.subscribe(channel);

    // Filtrar solo mensajes de tipo 'stats'
    return this.websocketService.filterByType<Estadisticas>('stats');
  }

  /**
   * Obtiene el estado de conexión del WebSocket
   */
  getConnectionStatus(): Observable<boolean> {
    return this.websocketService.connectionStatus$;
  }

  /**
   * Desconecta del WebSocket
   */
  desconectar(): void {
    this.websocketService.disconnect();
  }
}
