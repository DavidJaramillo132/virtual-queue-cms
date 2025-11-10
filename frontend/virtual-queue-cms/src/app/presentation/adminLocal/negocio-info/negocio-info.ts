import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NegocioServices } from '../../../services/Rest/negocio-services';
import { UserService } from '../../../services/Rest/userServices';
import { INegocio } from '../../../domain/entities';

@Component({
  selector: 'app-negocio-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './negocio-info.html',
  styleUrls: ['./negocio-info.css']
})
export class NegocioInfoComponent implements OnInit {
  // Estado de edición y mensajes
  isEditing = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Data del negocio
  negocio = signal<INegocio | null>(null);
  negocioTemp: Partial<INegocio> = {};
  
  private negocioId: string = '';

  constructor(
    private negocioService: NegocioServices,
    private userService: UserService
  ) {
    // Obtener el negocio_id del usuario autenticado
    const currentUser = this.userService.currentUserValue;
    if (currentUser && currentUser.negocio_id) {
      this.negocioId = currentUser.negocio_id;
    }
  }

  ngOnInit() {
    if (this.negocioId) {
      this.cargarNegocio();
    } else {
      this.errorMessage.set('No se encontró información del negocio. Por favor, inicie sesión nuevamente.');
    }
  }

  cargarNegocio() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.negocioService.getNegocioById(this.negocioId).subscribe({
      next: (data) => {
        this.negocio.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar la información del negocio');
        this.isLoading.set(false);
        console.error('Error al cargar negocio:', error);
      }
    });
  }

  toggleEdit() {
    if (this.isEditing()) {
      // Cancelar edición
      this.negocioTemp = {};
      this.errorMessage.set('');
      this.successMessage.set('');
    } else {
      // Iniciar edición - copiar datos actuales
      const currentNegocio = this.negocio();
      if (currentNegocio) {
        this.negocioTemp = { ...currentNegocio };
      }
    }
    this.isEditing.set(!this.isEditing());
  }

  guardarCambios() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validar que tengamos negocio_id
    if (!this.negocioId) {
      this.errorMessage.set('Error: No se encontró el ID del negocio');
      this.isLoading.set(false);
      return;
    }

    // Preparar datos para actualizar (solo campos editables)
    const dataToUpdate: Partial<INegocio> = {
      nombre: this.negocioTemp.nombre,
      categoria: this.negocioTemp.categoria,
      descripcion: this.negocioTemp.descripcion,
      direccion: this.negocioTemp.direccion,
      telefono: this.negocioTemp.telefono,
      correo: this.negocioTemp.correo
    };

    this.negocioService.updateNegocio(this.negocioId, dataToUpdate).subscribe({
      next: (negocioActualizado) => {
        this.negocio.set(negocioActualizado);
        this.successMessage.set('Información actualizada correctamente');
        this.isEditing.set(false);
        this.isLoading.set(false);
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al actualizar la información');
        this.isLoading.set(false);
        console.error('Error al actualizar negocio:', error);
      }
    });
  }
}
