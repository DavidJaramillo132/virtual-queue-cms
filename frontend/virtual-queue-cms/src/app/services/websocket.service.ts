import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, timer } from 'rxjs';
import { filter, map, retry } from 'rxjs/operators';

export interface WebSocketMessage {
  type: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$!: WebSocketSubject<WebSocketMessage>;
  private messagesSubject$ = new Subject<WebSocketMessage>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  public messages$ = this.messagesSubject$.asObservable();
  public connectionStatus$ = new Subject<boolean>();

  constructor() {}

  /**
   * Conecta al servidor WebSocket con autenticación JWT
   * @param token Token JWT para autenticación
   */
  connect(token: string): void {
    if (this.isConnected) {
      console.warn(' WebSocket already connected');
      return;
    }

    const wsUrl = `ws://localhost:8080/ws?token=${token}`;
    
    this.socket$ = webSocket<WebSocketMessage>({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionStatus$.next(true);
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.connectionStatus$.next(false);
          this.attemptReconnect(token);
        }
      }
    });

    // Suscribirse a los mensajes entrantes
    this.socket$.pipe(
      retry({
        count: this.maxReconnectAttempts,
        delay: (error, retryCount) => {
          console.log(`Reconnecting... attempt ${retryCount}`);
          return timer(Math.min(1000 * Math.pow(2, retryCount), 30000));
        }
      })
    ).subscribe({
      next: (message) => {
        console.log(' Mensaje WebSocket recibido:', message);
        this.messagesSubject$.next(message);
      },
      error: (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatus$.next(false);
      }
    });
  }

  /**
   * Intenta reconectar al WebSocket
   */
  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(token);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Envía un mensaje de suscripción a un canal
   * @param channel Nombre del canal (ej: "estadisticas:negocio_123")
   */
  subscribe(channel: string): void {
    if (!this.socket$) {
      console.error('Cannot subscribe: Socket not initialized');
      return;
    }

    // Si no está conectado, esperar a que se conecte
    if (!this.isConnected) {
      const subscription = this.connectionStatus$.subscribe(connected => {
        if (connected) {
          const message: WebSocketMessage = {
            type: 'subscribe',
            data: { channel }
          };
          this.socket$.next(message);
          console.log(`Subscribed to channel: ${channel}`);
          subscription.unsubscribe();
        }
      });
      return;
    }

    const message: WebSocketMessage = {
      type: 'subscribe',
      data: { channel }
    };

    this.socket$.next(message);
    console.log(`Subscribed to channel: ${channel}`);
  }

  /**
   * Filtra los mensajes por tipo
   * @param messageType Tipo de mensaje a filtrar
   * @returns Observable de mensajes filtrados
   */
  filterByType<T>(messageType: string): Observable<T> {
    return this.messages$.pipe(
      filter(msg => {
        const matches = msg.type === messageType;
        if (!matches) {
          console.log(` Mensaje filtrado (tipo: ${msg.type}, esperado: ${messageType}):`, msg);
        } else {
          console.log(` Mensaje de tipo '${messageType}' encontrado:`, msg);
        }
        return matches;
      }),
      map(msg => {
        console.log(` Extrayendo data del mensaje:`, msg.data);
        return msg.data as T;
      })
    );
  }

  /**
   * Cierra la conexión WebSocket
   */
  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.isConnected = false;
      this.connectionStatus$.next(false);
      console.log('WebSocket disconnected manually');
    }
  }

  /**
   * Verifica si el WebSocket está conectado
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}
