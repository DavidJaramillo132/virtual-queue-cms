import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BusinessCard } from '../../componets/business-card/business-card';
@Component({
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BusinessCard],
  templateUrl: './home.html',
})
export class Home {
  form: FormGroup;
  negocios: any[] = [];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});

    // Ejemplo de datos de negocios
    this.negocios = [
      { id: 'business1', nombre: 'Restaurante El Buen Sabor', direccion: 'Av. Flavio Reyes, Manta', tiempoEspera: '15-20 min', enFila: '8 personas', icon: '🍽️' },
      { id: 'business2', nombre: 'Hospital San Rafael', direccion: 'Calle 23 y Av. 4 de Noviembre', tiempoEspera: '—', enFila: 'Consulta', icon: '🏥', accion: 'Agendar Cita' },
      { id: 'business3', nombre: 'Veterinaria Mundo Animal', direccion: 'Av. Circunvalación, Manta', tiempoEspera: '30-45 min', enFila: '—', icon: '🐾' },
      { id: 'business4', nombre: 'Clínica Dental Sonrisa', direccion: 'Av. Salud 456', tiempoEspera: '20-30 min', enFila: '3 personas', icon: '🦷' }
    ];
  }
}