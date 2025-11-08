import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ServicioServicios } from '../../../services/Rest/servicio-servicios';
import { IServicio } from '../../../domain/entities';

interface ServicioExtendido extends IServicio {
  activo?: boolean;
  duracion?: number;
  precio?: number;
}

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './servicios.html',
  styleUrls: ['./servicios.css']
})
export class ServiciosComponent implements OnInit {
  faPencil = faPencil;
  faTrash = faTrash;
  faPlus = faPlus;

  servicios = signal<ServicioExtendido[]>([]);
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  servicioActual: Partial<ServicioExtendido> = this.getEmptyServicio();

  constructor(private servicioService: ServicioServicios) {}

  ngOnInit() {
    this.cargarServicios();
  }

  cargarServicios() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.servicioService.getAllServicios().subscribe({
      next: (data) => {
        const serviciosExtendidos: ServicioExtendido[] = data.map(s => ({
          ...s,
          activo: true, // IServicio ya no tiene 'visible'
          duracion: s.duracion_minutos,
          precio: s.precio_centavos / 100 // Convertir centavos a unidad
        }));
        this.servicios.set(serviciosExtendidos);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar los servicios');
        this.isLoading.set(false);
        console.error('Error al cargar servicios:', error);
      }
    });
  }

  getEmptyServicio(): Partial<ServicioExtendido> {
    return {
      nombre: '',
      descripcion: '',
      duracion: 30,
      duracion_minutos: 30,
      activo: true,
      precio: 0,
      precio_centavos: 0,
      negocio_id: ''
    };
  }

  abrirModalNuevo() {
    this.servicioActual = this.getEmptyServicio();
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  abrirModalEditar(servicio: ServicioExtendido) {
    this.servicioActual = { ...servicio };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  cerrarModal() {
    this.showModal.set(false);
    this.servicioActual = this.getEmptyServicio();
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  guardarServicio() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const servicioParaGuardar: Partial<IServicio> = {
      nombre: this.servicioActual.nombre,
      descripcion: this.servicioActual.descripcion,
      duracion_minutos: this.servicioActual.duracion || 30,
      precio_centavos: (this.servicioActual.precio || 0) * 100, // Convertir a centavos
      negocio_id: this.servicioActual.negocio_id || ''
    };

    if (this.isEditing() && this.servicioActual.id) {
      this.servicioService.actualizarServicio(this.servicioActual.id, servicioParaGuardar).subscribe({
        next: (servicioActualizado) => {
          const serviciosActualizados = this.servicios().map(s => 
            s.id === servicioActualizado.id ? {
              ...servicioActualizado,
              activo: true,
              duracion: servicioActualizado.duracion_minutos,
              precio: servicioActualizado.precio_centavos / 100
            } : s
          );
          this.servicios.set(serviciosActualizados);
          this.successMessage.set('Servicio actualizado correctamente');
          this.isLoading.set(false);
          setTimeout(() => this.cerrarModal(), 1500);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Error al actualizar el servicio');
          this.isLoading.set(false);
        }
      });
    } else {
      this.servicioService.agregarServicio(servicioParaGuardar).subscribe({
        next: (nuevoServicio) => {
          const servicioExtendido: ServicioExtendido = {
            ...nuevoServicio,
            activo: true,
            duracion: nuevoServicio.duracion_minutos,
            precio: nuevoServicio.precio_centavos / 100
          };
          this.servicios.set([...this.servicios(), servicioExtendido]);
          this.successMessage.set('Servicio creado correctamente');
          this.isLoading.set(false);
          setTimeout(() => this.cerrarModal(), 1500);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Error al crear el servicio');
          this.isLoading.set(false);
        }
      });
    }
  }

  eliminarServicio(servicio: ServicioExtendido) {
    if (confirm('Estás seguro de eliminar este servicio?')) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.servicioService.eliminarServicio(servicio.id).subscribe({
        next: () => {
          this.servicios.set(this.servicios().filter(s => s.id !== servicio.id));
          this.successMessage.set('Servicio eliminado correctamente');
          this.isLoading.set(false);
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Error al eliminar el servicio');
          this.isLoading.set(false);
        }
      });
    }
  }

  toggleEstado(servicio: ServicioExtendido) {
    const nuevoEstado = !servicio.activo;
    // Como ya no existe el campo 'visible', actualizamos el estado local
    servicio.activo = nuevoEstado;
    this.servicios.set([...this.servicios()]);
    this.successMessage.set(`Servicio ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
    setTimeout(() => this.successMessage.set(''), 3000);
  }
}
