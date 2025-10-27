import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DiaHorario {
  dia: string;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
}

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.html',
  styleUrls: ['./horarios.css']
})
export class HorariosComponent implements OnInit {
  // Data - Preparado para conexión a BD
  horarios = signal<DiaHorario[]>([
    { dia: 'Domingo', activo: false, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Lunes', activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Martes', activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Miércoles', activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Jueves', activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Viernes', activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Sábado', activo: false, horaInicio: '09:00', horaFin: '18:00' }
  ]);

  ngOnInit() {
    // TODO: Aquí se cargará la data desde el servicio
    // this.cargarHorarios();
  }

  // Método preparado para conexión con BD
  cargarHorarios() {
    // TODO: Implementar llamada al servicio
    // this.horariosService.getHorarios().subscribe(data => {
    //   this.horarios.set(data);
    // });
  }

  toggleDia(dia: DiaHorario) {
    dia.activo = !dia.activo;
    // Actualizar señal para disparar la detección de cambios
    this.horarios.set([...this.horarios()]);
  }

  guardarHorarios() {
    // TODO: Implementar llamada al servicio para guardar
    // this.horariosService.updateHorarios(this.horarios()).subscribe(
    //   () => {
    //     alert('Horarios guardados correctamente');
    //   }
    // );
    alert('Horarios guardados correctamente');
  }

  convertTo12Hour(time24: string): string {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
}
