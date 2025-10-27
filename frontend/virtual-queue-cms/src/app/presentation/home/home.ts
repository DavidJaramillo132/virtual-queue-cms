import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BusinessCard } from '../../componets/business-card/business-card';
import { NegocioServices } from '../../services/negocio-services';
import { INegocio } from '../../domain/entities';

@Component({
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BusinessCard],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  form: FormGroup;
  negocios: INegocio[] = [];
  isLoading: boolean = false;
  error: string = '';

  constructor(private fb: FormBuilder, private negocioServices: NegocioServices) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.getNegocios();
  }

  getNegocios(): void {
    this.isLoading = true;
    this.error = '';
    
    this.negocioServices.getNegocios().subscribe({
      next: (data) => {
        this.negocios = data;
        this.isLoading = false;
        console.log('Negocios cargados:', this.negocios);
      },
      error: (err) => {
        console.error('Error al cargar negocios:', err);
        this.error = 'No se pudieron cargar los negocios. Por favor, intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }
}