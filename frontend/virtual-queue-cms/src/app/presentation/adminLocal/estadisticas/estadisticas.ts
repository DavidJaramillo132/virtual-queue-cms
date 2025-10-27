import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faUsers, faClock, faChartLine } from '@fortawesome/free-solid-svg-icons';

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
export class EstadisticasComponent implements OnInit {
  // Icons
  faCalendar = faCalendar;
  faUsers = faUsers;
  faClock = faClock;
  faChartLine = faChartLine;

  // Data signals - Preparado para conexión a BD
  estadisticas = signal<EstadisticasData>({
    totalCitas: 156,
    citasHoy: 12,
    tiempoEspera: 15,
    satisfaccion: 4.5,
    citasCompletadas: 142,
    citasCanceladas: 8,
    nuevosClientes: 23
  });

  ngOnInit() {
    // TODO: Aquí se cargará la data desde el servicio
    // this.cargarEstadisticas();
  }

  // Método preparado para conexión con BD
  cargarEstadisticas() {
    // TODO: Implementar llamada al servicio
    // this.estadisticasService.getEstadisticas().subscribe(data => {
    //   this.estadisticas.set(data);
    // });
  }
}
