import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasComponent } from './estadisticas/estadisticas';
import { NegocioInfoComponent } from './negocio-info/negocio-info';
import { ServiciosComponent } from './servicios/servicios';
import { HorariosComponent } from './horarios/horarios';
import { CitasComponent } from './citas/citas';

@Component({
  selector: 'app-admin-local',
  standalone: true,
  imports: [
    CommonModule,
    EstadisticasComponent,
    NegocioInfoComponent,
    ServiciosComponent,
    HorariosComponent,
    CitasComponent
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
