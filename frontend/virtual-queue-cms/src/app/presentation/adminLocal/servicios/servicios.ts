import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio?: number;
  activo: boolean;
}

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './servicios.html',
  styleUrls: ['./servicios.css']
})
export class ServiciosComponent implements OnInit {
  // Icons
  faPencil = faPencil;
  faTrash = faTrash;
  faPlus = faPlus;

  // Data - Preparado para conexión a BD
  servicios = signal<Servicio[]>([
    {
      id: 1,
      nombre: 'Reserva de Mesa',
      descripcion: 'Reserva tu mesa con anticipación',
      duracion: 90,
      precio: 0,
      activo: true
    },
    {
      id: 2,
      nombre: 'Consulta General',
      descripcion: 'Revisión general de tu mascota',
      duracion: 30,
      precio: 25,
      activo: true
    },
    {
      id: 3,
      nombre: 'Vacunación',
      descripcion: 'Vacunas para tu mascota',
      duracion: 15,
      precio: 15,
      activo: true
    },
    {
      id: 4,
      nombre: 'Consulta Médica',
      descripcion: 'Consulta con médico general',
      duracion: 20,
      precio: 30,
      activo: true
    }
  ]);

  // Modal state
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  servicioActual: Servicio = this.getEmptyServicio();

  ngOnInit() {
    // TODO: Aquí se cargará la data desde el servicio
    // this.cargarServicios();
  }

  // Método preparado para conexión con BD
  cargarServicios() {
    // TODO: Implementar llamada al servicio
    // this.serviciosService.getServicios().subscribe(data => {
    //   this.servicios.set(data);
    // });
  }

  getEmptyServicio(): Servicio {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      duracion: 30,
      precio: 0,
      activo: true
    };
  }

  abrirModalNuevo() {
    this.servicioActual = this.getEmptyServicio();
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  abrirModalEditar(servicio: Servicio) {
    this.servicioActual = { ...servicio };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  cerrarModal() {
    this.showModal.set(false);
    this.servicioActual = this.getEmptyServicio();
  }

  guardarServicio() {
    if (this.isEditing()) {
      // TODO: Actualizar en BD
      // this.serviciosService.updateServicio(this.servicioActual).subscribe(...)
      const serviciosActualizados = this.servicios().map(s => 
        s.id === this.servicioActual.id ? this.servicioActual : s
      );
      this.servicios.set(serviciosActualizados);
    } else {
      // TODO: Crear en BD
      // this.serviciosService.createServicio(this.servicioActual).subscribe(...)
      const nuevoId = Math.max(...this.servicios().map(s => s.id), 0) + 1;
      this.servicioActual.id = nuevoId;
      this.servicios.set([...this.servicios(), this.servicioActual]);
    }
    this.cerrarModal();
  }

  eliminarServicio(id: number) {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      // TODO: Eliminar en BD
      // this.serviciosService.deleteServicio(id).subscribe(...)
      this.servicios.set(this.servicios().filter(s => s.id !== id));
    }
  }

  toggleEstado(servicio: Servicio) {
    servicio.activo = !servicio.activo;
    // TODO: Actualizar en BD
    // this.serviciosService.updateServicio(servicio).subscribe(...)
  }
}
