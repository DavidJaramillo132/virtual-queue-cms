import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faUsers, faClock, faChartLine, faCheck, faTimes, faCircle } from '@fortawesome/free-solid-svg-icons';
import { EstadisticasService } from '../../../services/estadisticas.service';
interface EstadisticasData {
  totalCitas: number;
  citasHoy: number;
  tiempoEspera: number;
  satisfaccion: number;
  citasCompletadas: number;
  citasCanceladas: number;
  nuevosClientes: number;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css']
})
export class EstadisticasComponent implements OnInit, OnDestroy {
  // Services
  private estadisticasService = inject(EstadisticasService);

  // Icons
  faCalendar = faCalendar;
  faUsers = faUsers;
  faClock = faClock;
  faChartLine = faChartLine;
  faCheck = faCheck;
  faTimes = faTimes;
  faCircle = faCircle;

  // Signals
  estadisticas = signal<EstadisticasData>({
    totalCitas: 0,
    citasHoy: 0,
    tiempoEspera: 15, // Valor estático temporal
    satisfaccion: 4.5, // Valor estático temporal
    citasCompletadas: 0,
    citasCanceladas: 0,
    nuevosClientes: 23 // Valor estático temporal
  });

  isConnected = signal<boolean>(false);
  lastUpdate = signal<Date>(new Date());

  ngOnInit() {
    this.conectarWebSocket();
    this.monitorearConexion();
  }

  ngOnDestroy() {
    // Desconectar WebSocket al destruir el componente
    this.estadisticasService.desconectar();
  }

  /**
   * Conecta al WebSocket y suscribe a las estadísticas en tiempo real
   */
  conectarWebSocket() {
    // Obtener el token JWT del localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No se encontró el token de autenticación');
      return;
    }

    // Obtener el negocio_id del usuario
    const negocioId = this.obtenerNegocioId();
    
    if (!negocioId) {
      console.error('No se encontró el ID del negocio');
      return;
    }

    // Conectar y suscribirse a las estadísticas
    this.estadisticasService.obtenerEstadisticasEnTiempoReal(token, negocioId)
      .subscribe({
        next: (stats: any) => {
          // Extraer valores con múltiples formatos posibles
          const totalCitas = stats.total_citas || stats.totalCitas || 0;
          const citasHoy = stats.citas_hoy || stats.citasHoy || 0;
          const citasCompletadas = stats.citas_completadas || stats.citasCompletadas || 0;
          const citasCanceladas = stats.citas_canceladas || stats.citasCanceladas || 0;
          
          // Actualizar las estadísticas
          this.estadisticas.update(current => ({
            ...current,
            totalCitas: totalCitas,
            citasHoy: citasHoy,
            citasCompletadas: citasCompletadas,
            citasCanceladas: citasCanceladas
          }));
          
          // Actualizar timestamp
          this.lastUpdate.set(new Date());
        },
        error: (error) => {
          console.error('Error al recibir estadísticas:', error);
        }
      });
  }

  /**
   * Monitorea el estado de conexión del WebSocket
   */
  monitorearConexion() {
    this.estadisticasService.getConnectionStatus()
      .subscribe(connected => {
        this.isConnected.set(connected);
      });
  }

  private obtenerNegocioId(): string | null {
    const userStr = localStorage.getItem('currentUser');
    
    if (!userStr) {
      return null;
    }
    
    try {
      const user = JSON.parse(userStr);
      // Intentar diferentes campos posibles
      return user.negocio_id || user.negocioId || user.id_negocio || null;
    } catch (error) {
      console.error('Error parseando currentUser:', error);
      return null;
    }
  }

  /**
   * Reconectar manualmente al WebSocket
   */
  reconectar() {
    this.estadisticasService.desconectar();
    this.conectarWebSocket();
  }
}
