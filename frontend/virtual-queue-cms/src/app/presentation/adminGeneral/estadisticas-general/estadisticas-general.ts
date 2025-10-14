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

interface EstadisticasGeneralData {
  totalNegocios: number;
  negociosActivos: number;
  totalUsuarios: number;
  totalCitas: number;
  crecimiento: number;
  advertencias: number;
  negociosConAdvertencias: number;
}

interface CategoriaNegocio {
  nombre: string;
  cantidad: number;
}

interface ActividadReciente {
  tipo: 'nuevo_negocio' | 'advertencia' | 'usuario_eliminado';
  titulo: string;
  descripcion: string;
  tiempo: string;
}

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

  // Data signals - Preparado para conexión a BD
  estadisticas = signal<EstadisticasGeneralData>({
    totalNegocios: 45,
    negociosActivos: 42,
    totalUsuarios: 1250,
    totalCitas: 3420,
    crecimiento: 12.5,
    advertencias: 3,
    negociosConAdvertencias: 3
  });

  categorias = signal<CategoriaNegocio[]>([
    { nombre: 'Restaurantes', cantidad: 12 },
    { nombre: 'Veterinarias', cantidad: 8 },
    { nombre: 'Hospitales', cantidad: 5 },
    { nombre: 'Salones de Belleza', cantidad: 10 },
    { nombre: 'Otros', cantidad: 10 }
  ]);

  actividadReciente = signal<ActividadReciente[]>([
    {
      tipo: 'nuevo_negocio',
      titulo: 'Nuevo negocio registrado',
      descripcion: 'Salón de Belleza Glamour - Hace 2 horas',
      tiempo: 'Hace 2 horas'
    },
    {
      tipo: 'advertencia',
      titulo: 'Advertencia emitida',
      descripcion: 'Restaurante El Buen Sabor - Hace 5 horas',
      tiempo: 'Hace 5 horas'
    },
    {
      tipo: 'usuario_eliminado',
      titulo: 'Usuario eliminado',
      descripcion: 'cliente@example.com - Hace 1 día',
      tiempo: 'Hace 1 día'
    }
  ]);

  ngOnInit() {
    // TODO: Aquí se cargará la data desde el servicio
    // this.cargarEstadisticas();
  }

  // Método preparado para conexión con BD
  cargarEstadisticas() {
    // TODO: Implementar llamada al servicio
    // this.estadisticasService.getEstadisticasGenerales().subscribe(data => {
    //   this.estadisticas.set(data);
    // });
  }
}
