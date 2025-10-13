import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BusinessCard } from './business-card/business-card';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BusinessCard],
  templateUrl: './cliente.html',
  styleUrls: ['./cliente.css']
})
export class Cliente implements OnInit {
  form: FormGroup;
  negocios: any[] = [];
  
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
    
    // Ejemplo de datos de negocios
    this.negocios = [
      { nombre: 'Restaurante El Buen Sabor', direccion: 'Av. Flavio Reyes, Manta', tiempoEspera: '15-20 min', enFila: '8 personas', icon: '🍽️' },
      { nombre: 'Hospital San Rafael', direccion: 'Calle 23 y Av. 4 de Noviembre', tiempoEspera: '—', enFila: 'Consulta', icon: '🏥', accion: 'Agendar Cita' },
      { nombre: 'Veterinaria Mundo Animal', direccion: 'Av. Circunvalación, Manta', tiempoEspera: '30-45 min', enFila: '—', icon: '🐾' }
    ];
  }

  ngOnInit(): void {}
}
