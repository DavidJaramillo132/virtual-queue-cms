import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasGeneralComponent } from './estadisticas-general/estadisticas-general';
import { NegociosComponent } from './negocios/negocios';
import { UsuariosComponent } from './usuarios/usuarios';
import { ReportesComponent } from './reportes/reportes';

@Component({
  selector: 'app-admin-general',
  standalone: true,
  imports: [
    CommonModule,
    EstadisticasGeneralComponent,
    NegociosComponent,
    UsuariosComponent,
    ReportesComponent
  ],
  templateUrl: './admin-general.html',
  styleUrls: ['./admin-general.css']
})
export class AdminGeneral {
  activeTab = signal<string>('estadisticas');

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }
}
