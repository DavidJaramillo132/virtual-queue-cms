import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatOption {
  label: string;
  value: string;
  data?: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  options?: ChatOption[];
}

export interface ChatRequest {
  mensaje: string;
  usuario_id?: string;
  reiniciar_contexto?: boolean;
  contexto?: {
    negocio_id?: string;
    servicio_id?: string;
    estacion_id?: string;
    negocio_nombre?: string;
    servicio_nombre?: string;
    estacion_nombre?: string;
    fecha?: string;
    hora_inicio?: string;
    hora_fin?: string;
  };
  archivo?: {
    tipo: string;
    datos: string;
  };
}

export interface ChatResponse {
  exito: boolean;
  respuesta: string;
  herramientas_ejecutadas: any[];
  archivo_procesado: any;
  contexto_mantenido: boolean;
  opciones?: ChatOption[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatBotService {
  private readonly API_URL = 'http://localhost:8001/api/chat';
  
  constructor(private http: HttpClient) {}

  /**
   * Obtiene el ID del usuario desde localStorage
   */
  private getUserIdFromLocalStorage(): string | null {
    try {
      const userDataStr = localStorage.getItem('currentUser');
      if (userDataStr && userDataStr !== 'undefined') {
        const userData = JSON.parse(userDataStr);
        return userData.id || null;
      }
      return null;
    } catch (error) {
      console.error('Error al leer currentUser del localStorage:', error);
      return null;
    }
  }

  sendMessage(mensaje: string, contexto?: any, reiniciarContexto: boolean = false): Observable<ChatResponse> {
    const usuarioId = this.getUserIdFromLocalStorage();
    
    const request: ChatRequest = {
      mensaje,
      usuario_id: usuarioId || undefined,
      contexto: contexto,
      reiniciar_contexto: reiniciarContexto
    };

    return this.http.post<ChatResponse>(this.API_URL, request);
  }

  /**
   * Reinicia el contexto del chat (nueva conversación)
   */
  reiniciarChat(): Observable<any> {
    return this.http.post(`${this.API_URL}/reiniciar`, {});
  }
}
