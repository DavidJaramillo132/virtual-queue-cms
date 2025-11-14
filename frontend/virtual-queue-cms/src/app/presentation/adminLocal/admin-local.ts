import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasComponent } from './estadisticas/estadisticas';
import { NegocioInfoComponent } from './negocio-info/negocio-info';
import { ServiciosComponent } from './servicios/servicios';
import { HorariosComponent } from './horarios/horarios';
import { CitasComponent } from './citas/citas';
import { EstacionesComponent } from './estaciones/estaciones';
import { Reportes } from '../adminLocal/reportes/reportes';
@Component({
  selector: 'app-admin-local',
  standalone: true,
  imports: [
    CommonModule,
    EstadisticasComponent,
    NegocioInfoComponent,
    ServiciosComponent,
    HorariosComponent,
    CitasComponent,
    EstacionesComponent,
    Reportes
  ],
  templateUrl: './admin-local.html',
  styleUrls: ['./admin-local.css']
})
export class AdminLocal {
  activeTab = signal<string>('estadisticas');

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }
}
