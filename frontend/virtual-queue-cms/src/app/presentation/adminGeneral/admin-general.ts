import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasGeneralComponent } from './estadisticas-general/estadisticas-general';
import { NegociosComponent } from './negocios/negocios';
import { UsuariosComponent } from './usuarios/usuarios';

@Component({
  selector: 'app-admin-general',
  standalone: true,
  imports: [
    CommonModule,
    EstadisticasGeneralComponent,
    NegociosComponent,
    UsuariosComponent
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
