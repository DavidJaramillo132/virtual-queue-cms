import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstacionServices } from '../../../services/Rest/estacion-services';
import { UserService } from '../../../services/Rest/userServices';
import { IEstacion } from '../../../domain/entities/IEstacion';

@Component({
  selector: 'app-estaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estaciones.html',
  styleUrls: ['./estaciones.css']
})
export class EstacionesComponent implements OnInit {
  estaciones = signal<IEstacion[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  
  // Para el formulario
  mostrarFormulario = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  estacionEditando: IEstacion | null = null;
  
  formulario = {
    nombre: '',
    tipo: '',
    estado: 'activa' as 'activa' | 'inactiva',
    solo_premium: false
  };
  
  private negocioId: string = '';

  constructor(
    private estacionService: EstacionServices,
    private userService: UserService
  ) {
    // Obtener el negocio_id del usuario autenticado
    const currentUser = this.userService.currentUserValue;
    if (currentUser && currentUser.negocio_id) {
      this.negocioId = currentUser.negocio_id;
    }
  }

  ngOnInit() {
    if (!this.negocioId) {
      this.errorMessage.set('No se encontró el negocio del usuario. Por favor, inicie sesión nuevamente.');
      return;
    }
    this.cargarEstaciones();
  }

  cargarEstaciones() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.estacionService.getEstacionesByNegocio(this.negocioId).subscribe({
      next: (data) => {
        this.estaciones.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar las estaciones');
        this.isLoading.set(false);
        console.error('Error al cargar estaciones:', error);
      }
    });
  }

  abrirFormularioNuevo() {
    this.formulario = {
      nombre: '',
      tipo: '',
      estado: 'activa',
      solo_premium: false
    };
    this.modoEdicion.set(false);
    this.estacionEditando = null;
    this.mostrarFormulario.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  abrirFormularioEditar(estacion: IEstacion) {
    this.formulario = {
      nombre: estacion.nombre,
      tipo: estacion.tipo || '',
      estado: estacion.estado,
      solo_premium: estacion.solo_premium || false
    };
    this.modoEdicion.set(true);
    this.estacionEditando = estacion;
    this.mostrarFormulario.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  cerrarFormulario() {
    this.mostrarFormulario.set(false);
    this.modoEdicion.set(false);
    this.estacionEditando = null;
    this.formulario = {
      nombre: '',
      tipo: '',
      estado: 'activa',
      solo_premium: false
    };
  }

  guardarEstacion() {
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validar campos requeridos
    if (!this.formulario.nombre.trim()) {
      this.errorMessage.set('El nombre de la estación es requerido');
      return;
    }

    this.isLoading.set(true);

    if (this.modoEdicion() && this.estacionEditando) {
      // Modo edición
      const datosActualizados: Partial<IEstacion> = {
        nombre: this.formulario.nombre,
        tipo: this.formulario.tipo || undefined,
        estado: this.formulario.estado,
        solo_premium: this.formulario.solo_premium
      };

      this.estacionService.updateEstacion(this.estacionEditando.id, datosActualizados).subscribe({
        next: () => {
          this.successMessage.set('Estación actualizada exitosamente');
          this.isLoading.set(false);
          this.cerrarFormulario();
          this.cargarEstaciones();
          
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Error al actualizar la estación');
          this.isLoading.set(false);
          console.error('Error al actualizar estación:', error);
        }
      });
    } else {
      // Modo creación
      const nuevaEstacion: Partial<IEstacion> = {
        negocio_id: this.negocioId,
        nombre: this.formulario.nombre,
        tipo: this.formulario.tipo || undefined,
        estado: this.formulario.estado,
        solo_premium: this.formulario.solo_premium
      };

      this.estacionService.createEstacion(nuevaEstacion).subscribe({
        next: () => {
          this.successMessage.set('Estación creada exitosamente');
          this.isLoading.set(false);
          this.cerrarFormulario();
          this.cargarEstaciones();
          
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Error al crear la estación');
          this.isLoading.set(false);
          console.error('Error al crear estación:', error);
        }
      });
    }
  }

  eliminarEstacion(estacion: IEstacion) {
    if (!confirm(`¿Está seguro de que desea eliminar la estación "${estacion.nombre}"?`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.estacionService.deleteEstacion(estacion.id).subscribe({
      next: () => {
        this.successMessage.set('Estación eliminada exitosamente');
        this.isLoading.set(false);
        this.cargarEstaciones();
        
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al eliminar la estación. Puede que tenga citas asociadas.');
        this.isLoading.set(false);
        console.error('Error al eliminar estación:', error);
      }
    });
  }

  cambiarEstado(estacion: IEstacion) {
    const nuevoEstado: 'activa' | 'inactiva' = estacion.estado === 'activa' ? 'inactiva' : 'activa';
    
    this.estacionService.updateEstacion(estacion.id, { estado: nuevoEstado }).subscribe({
      next: () => {
        this.successMessage.set(`Estación ${nuevoEstado === 'activa' ? 'activada' : 'desactivada'} exitosamente`);
        this.cargarEstaciones();
        
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cambiar el estado de la estación');
        console.error('Error al cambiar estado:', error);
      }
    });
  }
}
