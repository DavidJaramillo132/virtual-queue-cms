import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faChartBar, 
  faUsers, 
  faCalendar, 
  faChartPie,
  faDownload 
} from '@fortawesome/free-solid-svg-icons';

interface Reporte {
  id: string;
  titulo: string;
  descripcion: string;
  icono: any;
  items: string[];
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class ReportesComponent implements OnInit {
  // Icons
  faChartBar = faChartBar;
  faUsers = faUsers;
  faCalendar = faCalendar;
  faChartPie = faChartPie;
  faDownload = faDownload;

  // Data - Preparado para conexión a BD
  reportes = signal<Reporte[]>([
    {
      id: 'negocios',
      titulo: 'Reporte de Negocios',
      descripcion: 'Estadísticas detalladas de todos los negocios registrados',
      icono: this.faChartBar,
      items: [
        'Total de negocios por categoría',
        'Negocios activos vs inactivos',
        'Crecimiento mensual',
        'Negocios con advertencias'
      ]
    },
    {
      id: 'usuarios',
      titulo: 'Reporte de Usuarios',
      descripcion: 'Análisis completo de usuarios de la plataforma',
      icono: this.faUsers,
      items: [
        'Total de usuarios por rol',
        'Usuarios activos',
        'Nuevos registros mensuales',
        'Tasa de retención'
      ]
    },
    {
      id: 'citas',
      titulo: 'Reporte de Citas',
      descripcion: 'Estadísticas de todas las citas programadas',
      icono: this.faCalendar,
      items: [
        'Total de citas por mes',
        'Citas por estado',
        'Tasa de cancelación',
        'Servicios más solicitados'
      ]
    },
    {
      id: 'financiero',
      titulo: 'Reporte Financiero',
      descripcion: 'Análisis de ingresos y transacciones',
      icono: this.faChartPie,
      items: [
        'Ingresos totales por mes',
        'Ingresos por negocio',
        'Servicios más rentables',
        'Proyecciones de crecimiento'
      ]
    }
  ]);

  constructor() {}

  ngOnInit() {
    // Inicialización si es necesaria
  }

  descargarReporte(reporte: Reporte) {
    // TODO: Implementar con GraphQL
    console.log('Descargar reporte:', reporte.titulo);
    alert(`La funcionalidad de reportes se implementará con GraphQL`);
  }
}
