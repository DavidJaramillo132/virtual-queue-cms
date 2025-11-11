import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faStore, 
  faUsers, 
  faCalendar, 
  faChartLine, 
  faExclamationTriangle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { AdminGeneralService, EstadisticasGeneralData, CategoriaNegocio } from '../../../services/Rest/admin-general.service';

@Component({
  selector: 'app-estadisticas-general',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './estadisticas-general.html',
  styleUrls: ['./estadisticas-general.css']
})
export class EstadisticasGeneralComponent implements OnInit {
  // Icons
  faStore = faStore;
  faUsers = faUsers;
  faCalendar = faCalendar;
  faChartLine = faChartLine;
  faExclamationTriangle = faExclamationTriangle;
  faClock = faClock;

  // Data signals
  estadisticas = signal<EstadisticasGeneralData>({
    totalNegocios: 0,
    negociosActivos: 0,
    totalUsuarios: 0,
    totalCitas: 0,
    crecimiento: 0,
    advertencias: 0,
    negociosConAdvertencias: 0
  });

  categorias = signal<CategoriaNegocio[]>([]);
  loading = signal<boolean>(true);

  constructor(private adminGeneralService: AdminGeneralService) {}

  ngOnInit() {
    this.cargarEstadisticas();
  }

  /**
   * Calcula el porcentaje de una categoría respecto al total de negocios
   */
  calcularPorcentaje(cantidad: number): number {
    const total = this.estadisticas().totalNegocios;
    if (total === 0) return 0;
    return (cantidad / total) * 100;
  }

  // Carga todas las estadísticas desde el servicio
  cargarEstadisticas() {
    this.loading.set(true);
    
    // Cargar estadísticas generales
    this.adminGeneralService.getEstadisticasGenerales().subscribe({
      next: (data) => {
        this.estadisticas.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        this.loading.set(false);
      }
    });

    // Cargar categorías
    this.adminGeneralService.getCategorias().subscribe({
      next: (data) => {
        this.categorias.set(data);
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
      }
    });
    
  }
}
