import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitaService } from '../../../services/Rest/cita-services';
import { ICita } from '../../../domain/entities';

interface CitaExtendida extends ICita {
  nombreCliente?: string;
  nombreServicio?: string;
  posicionFila?: number;
}

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas.html',
  styleUrls: ['./citas.css']
})
export class CitasComponent implements OnInit {
  filtroEstado = signal<string>('todas');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  citas = signal<CitaExtendida[]>([]);

  constructor(private citaService: CitaService) {}

  ngOnInit() {
    this.cargarCitas();
  }

  cargarCitas() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.citaService.getAllCitas().subscribe({
      next: (data) => {
        this.citas.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar las citas');
        this.isLoading.set(false);
        console.error('Error al cargar citas:', error);
      }
    });
  }

  citasFiltradas() {
    const filtro = this.filtroEstado();
    if (filtro === 'todas') {
      return this.citas();
    }
    return this.citas().filter(c => c.estado === filtro);
  }

  cambiarEstado(cita: CitaExtendida, nuevoEstado: 'pendiente' | 'atendida' | 'cancelada') {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.citaService.updateEstadoCita(cita.id, nuevoEstado).subscribe({
      next: (citaActualizada) => {
        const citasActualizadas = this.citas().map(c => 
          c.id === cita.id ? { ...c, estado: citaActualizada.estado } : c
        );
        this.citas.set(citasActualizadas);
        this.successMessage.set('Estado actualizado correctamente');
        this.isLoading.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al actualizar el estado');
        this.isLoading.set(false);
        console.error('Error al actualizar estado:', error);
      }
    });
  }

  iniciarCita(cita: CitaExtendida) {
    this.cambiarEstado(cita, 'atendida');
  }

  confirmarCita(cita: CitaExtendida) {
    this.cambiarEstado(cita, 'pendiente');
  }

  completarCita(cita: CitaExtendida) {
    this.cambiarEstado(cita, 'atendida');
  }

  cancelarCita(cita: CitaExtendida) {
    if (confirm('Estás seguro de cancelar esta cita?')) {
      this.cambiarEstado(cita, 'cancelada');
    }
  }

  eliminarCita(cita: CitaExtendida) {
    if (confirm('Estás seguro de eliminar esta cita? Esta acción no se puede deshacer.')) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.citaService.deleteCita(cita.id).subscribe({
        next: () => {
          const citasActualizadas = this.citas().filter(c => c.id !== cita.id);
          this.citas.set(citasActualizadas);
          this.successMessage.set('Cita eliminada correctamente');
          this.isLoading.set(false);
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Error al eliminar la cita');
          this.isLoading.set(false);
          console.error('Error al eliminar cita:', error);
        }
      });
    }
  }

  getEstadoBadgeClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'pendiente': 'px-3 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full',
      'atendida': 'px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full',
      'cancelada': 'px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full'
    };
    return classes[estado] || classes['pendiente'];
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'atendida': 'Atendida',
      'cancelada': 'Cancelada'
    };
    return textos[estado] || estado;
  }

  formatearFecha(fecha: Date | string): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
