import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Cita {
  id: number;
  nombreCliente: string;
  servicio: string;
  fecha: string;
  hora: string;
  posicionFila: number;
  estado: 'confirmada' | 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
}

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas.html',
  styleUrls: ['./citas.css']
})
export class CitasComponent implements OnInit {
  // Filtros
  filtroEstado = signal<string>('todas');

  // Data - Preparado para conexión a BD
  citas = signal<Cita[]>([
    {
      id: 1,
      nombreCliente: 'María García',
      servicio: 'Consulta General',
      fecha: '2024-01-15',
      hora: '10:00',
      posicionFila: 1,
      estado: 'confirmada'
    },
    {
      id: 2,
      nombreCliente: 'Juan Pérez',
      servicio: 'Vacunación',
      fecha: '2024-01-15',
      hora: '10:30',
      posicionFila: 2,
      estado: 'pendiente'
    },
    {
      id: 3,
      nombreCliente: 'Ana López',
      servicio: 'Consulta General',
      fecha: '2024-01-15',
      hora: '11:00',
      posicionFila: 3,
      estado: 'en_progreso'
    },
    {
      id: 4,
      nombreCliente: 'Carlos Martínez',
      servicio: 'Reserva de Mesa',
      fecha: '2024-01-16',
      hora: '14:00',
      posicionFila: 1,
      estado: 'confirmada'
    }
  ]);

  ngOnInit() {
    // TODO: Aquí se cargará la data desde el servicio
    // this.cargarCitas();
  }

  // Método preparado para conexión con BD
  cargarCitas() {
    // TODO: Implementar llamada al servicio
    // this.citasService.getCitas().subscribe(data => {
    //   this.citas.set(data);
    // });
  }

  citasFiltradas() {
    const filtro = this.filtroEstado();
    if (filtro === 'todas') {
      return this.citas();
    }
    return this.citas().filter(c => c.estado === filtro);
  }

  cambiarEstado(cita: Cita, nuevoEstado: 'confirmada' | 'en_progreso' | 'completada' | 'cancelada') {
    cita.estado = nuevoEstado;
    // TODO: Actualizar en BD
    // this.citasService.updateCita(cita).subscribe(...)
    this.citas.set([...this.citas()]);
  }

  iniciarCita(cita: Cita) {
    this.cambiarEstado(cita, 'en_progreso');
  }

  confirmarCita(cita: Cita) {
    this.cambiarEstado(cita, 'confirmada');
  }

  completarCita(cita: Cita) {
    this.cambiarEstado(cita, 'completada');
  }

  cancelarCita(cita: Cita) {
    if (confirm('¿Estás seguro de cancelar esta cita?')) {
      this.cambiarEstado(cita, 'cancelada');
    }
  }

  getEstadoBadgeClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'confirmada': 'px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full',
      'pendiente': 'px-3 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full',
      'en_progreso': 'px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full',
      'completada': 'px-3 py-1 bg-gray-500 text-white text-xs font-medium rounded-full',
      'cancelada': 'px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full'
    };
    return classes[estado] || classes['pendiente'];
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'confirmada': 'Confirmada',
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'completada': 'Completada',
      'cancelada': 'Cancelada'
    };
    return textos[estado] || estado;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
