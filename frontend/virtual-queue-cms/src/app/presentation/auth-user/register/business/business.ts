import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './business.html',
})
export class Business implements OnInit, OnDestroy {
  @Input() parentForm!: FormGroup;
  businessForm!: FormGroup;

  categorias = [
    'Restaurante',
    'Salud',
    'Educación',
    'Entretenimiento',
    'Tecnología',
    'Belleza',
    'Servicios',
    'Otro'
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // Crear el formulario de negocio
    this.businessForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['', [Validators.required]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      telefono_negocio: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      imagen_url: [''],
    });

    // Agregar el formulario de negocio al formulario padre
    if (this.parentForm) {
      this.parentForm.addControl('negocio', this.businessForm);
    }
  }

  ngOnDestroy() {
    // Remover el formulario de negocio cuando el componente se destruya
    if (this.parentForm && this.parentForm.contains('negocio')) {
      this.parentForm.removeControl('negocio');
    }
  }
}
