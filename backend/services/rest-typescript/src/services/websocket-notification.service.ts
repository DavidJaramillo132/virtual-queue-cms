import axios from 'axios';
import * as fs from 'fs';

/**
 * Servicio para notificar al servidor WebSocket sobre cambios en las citas
 */
export class WebSocketNotificationService {
  private websocketUrl: string;

  constructor() {
    // URL del servidor WebSocket
    // Prioridad: variable de entorno > detección automática por entorno
    if (process.env.WEBSOCKET_URL) {
      this.websocketUrl = process.env.WEBSOCKET_URL;
      console.log(` [WebSocketNotificationService] URL configurada desde variable de entorno: ${this.websocketUrl}`);
    } else {
      // Detectar si estamos en Docker o desarrollo local
      // En Docker: usar el nombre del servicio
      // En local: usar localhost
      let isDocker = false;
      
      // Verificar si estamos en Docker
      if (process.env.DOCKER_CONTAINER === 'true') {
        isDocker = true;
      } else if (process.platform === 'linux') {
        // En Linux, verificar si existe el archivo /.dockerenv
        try {
          if (fs.existsSync('/.dockerenv')) {
            isDocker = true;
          }
        } catch (e) {
          // Si hay error, asumir que no estamos en Docker
        }
      }
      // En Windows o macOS, asumir desarrollo local a menos que esté explícitamente en Docker
      
      if (isDocker) {
        this.websocketUrl = 'http://websocket-server:8080';
        console.log(` [WebSocketNotificationService] URL usando valor por defecto (Docker): ${this.websocketUrl}`);
      } else {
        // Desarrollo local - usar localhost
        this.websocketUrl = 'http://localhost:8080';
        console.log(` [WebSocketNotificationService] URL usando valor por defecto (desarrollo local): ${this.websocketUrl}`);
        console.log(` [WebSocketNotificationService] Si estás en Docker, configura WEBSOCKET_URL=http://websocket-server:8080 en el archivo .env`);
      }
    }
  }

      // para debugging 
    async init(): Promise<void> {
      try {
        await this.verifyConnection();
      } catch (err) {
        console.warn(` [WebSocketNotificationService] No se pudo verificar conexión al WebSocket: ${err instanceof Error ? err.message : String(err)}`);
        console.warn(` [WebSocketNotificationService] Asegúrate de que el servidor WebSocket esté ejecutándose en ${this.websocketUrl}`);
      }
    }

  /**
   * Verifica la conectividad con el servidor WebSocket
   */
  private async verifyConnection(): Promise<void> {
    try {
      const response = await axios.get(`${this.websocketUrl}/health`, {
        timeout: 3000
      });
      console.log(` [WebSocketNotificationService] Conexión verificada con WebSocket: ${response.status}`);
    } catch (error: any) {
      console.warn(` [WebSocketNotificationService] No se pudo verificar conexión: ${error.message}`);
    }
  }

  /**
   * Notifica al servidor WebSocket sobre un cambio en una cita
   * @param negocioId ID del negocio
   * @param action Acción realizada: "created", "updated", "deleted", "status_changed"
   */
  async notifyCitaChange(negocioId: string, action: string): Promise<void> {
    console.log(` Intentando notificar al WebSocket: ${action} para negocio ${negocioId}`);
    console.log(` URL del WebSocket: ${this.websocketUrl}/notify/cita`);
    
    try {
      const response = await axios.post(
        `${this.websocketUrl}/notify/cita`, 
        {
          negocio_id: negocioId,
          action: action
        }, 
        {
          timeout: 5000, // 5 segundos de timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(` Notificación enviada al WebSocket: ${action} para negocio ${negocioId}`);
      console.log(`   Response status: ${response.status}`);
      console.log(`   Response data: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      // No lanzar error para no afectar la operación principal
      // Solo loggear el error
      console.error(` Error notificando al WebSocket: ${error.message}`);
      console.error(`   URL intentada: ${this.websocketUrl}/notify/cita`);
      
      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }
      
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error(`   No se recibió respuesta del servidor WebSocket`);
        // No hacer JSON.stringify de error.request porque puede tener referencias circulares
        console.error(`   Request method: ${error.request.method || 'N/A'}`);
        console.error(`   Request path: ${error.request.path || 'N/A'}`);
      }
      
      // Log stack trace para debugging
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    }
  }
}

