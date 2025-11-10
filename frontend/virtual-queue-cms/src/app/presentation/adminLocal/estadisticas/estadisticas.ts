import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faUsers, faClock, faChartLine, faCheck, faTimes, faCircle } from '@fortawesome/free-solid-svg-icons';
import { EstadisticasService } from '../../../services/estadisticas.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
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
  imports: [CommonModule, FontAwesomeModule, BaseChartDirective],
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

  // Configuración del gráfico de pastel (Estado de Citas)
  public pieChartData = signal<ChartData<'pie'>>({
    labels: ['Completadas', 'Canceladas', 'Pendientes'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',  // Verde
        'rgba(239, 68, 68, 0.8)',  // Rojo
        'rgba(59, 130, 246, 0.8)'  // Azul
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(59, 130, 246, 1)'
      ],
      borderWidth: 1
    }]
  });

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value} citas`;
          }
        }
      }
    }
  };

  // Configuración del gráfico de barras (Resumen)
  public barChartData = signal<ChartData<'bar'>>({
    labels: ['Total', 'Hoy', 'Completadas', 'Canceladas'],
    datasets: [{
      label: 'Citas',
      data: [0, 0, 0, 0],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',  // Índigo
        'rgba(59, 130, 246, 0.8)',  // Azul
        'rgba(34, 197, 94, 0.8)',   // Verde
        'rgba(239, 68, 68, 0.8)'    // Rojo
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 1
    }]
  });

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.parsed.y} citas`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

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
          console.log('📊 Estadísticas recibidas:', stats);
          
          // Extraer valores con múltiples formatos posibles
          const totalCitas = stats.total_citas || stats.totalCitas || 0;
          const citasHoy = stats.citas_hoy || stats.citasHoy || 0;
          const citasCompletadas = stats.citas_completadas || stats.citasCompletadas || 0;
          const citasCanceladas = stats.citas_canceladas || stats.citasCanceladas || 0;
          
          console.log(`📈 Valores extraídos: total=${totalCitas}, hoy=${citasHoy}, completadas=${citasCompletadas}, canceladas=${citasCanceladas}`);
          
          // Actualizar las estadísticas
          this.estadisticas.update(current => ({
            ...current,
            totalCitas: totalCitas,
            citasHoy: citasHoy,
            citasCompletadas: citasCompletadas,
            citasCanceladas: citasCanceladas
          }));
          
          // Actualizar gráficos
          this.actualizarGraficos(totalCitas, citasHoy, citasCompletadas, citasCanceladas);
          
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

  /**
   * Actualiza los gráficos con los nuevos datos
   */
  private actualizarGraficos(total: number, hoy: number, completadas: number, canceladas: number) {
    // Calcular pendientes (total - completadas - canceladas)
    const pendientes = Math.max(0, total - completadas - canceladas);

    // Actualizar gráfico de pastel
    this.pieChartData.set({
      labels: ['Completadas', 'Canceladas', 'Pendientes'],
      datasets: [{
        data: [completadas, canceladas, pendientes],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)'
        ],
        borderWidth: 1
      }]
    });

    // Actualizar gráfico de barras
    this.barChartData.set({
      labels: ['Total', 'Hoy', 'Completadas', 'Canceladas'],
      datasets: [{
        label: 'Citas',
        data: [total, hoy, completadas, canceladas],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }]
    });
  }
}
