import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorarioService } from '../../../services/Rest/horario-services';
import { IHorarioAtencion } from '../../../domain/entities';

interface DiaHorario {
  dia: string;
  diaSemana: number;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
  id?: string;
}

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.html',
  styleUrls: ['./horarios.css']
})
export class HorariosComponent implements OnInit {
  horarios = signal<DiaHorario[]>([
    { dia: 'Domingo', diaSemana: 0, activo: false, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Lunes', diaSemana: 1, activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Martes', diaSemana: 2, activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Miércoles', diaSemana: 3, activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Jueves', diaSemana: 4, activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Viernes', diaSemana: 5, activo: true, horaInicio: '09:00', horaFin: '18:00' },
    { dia: 'Sábado', diaSemana: 6, activo: false, horaInicio: '09:00', horaFin: '18:00' }
  ]);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  estacionId = signal<string>('');

  constructor(private horarioService: HorarioService) {}

  ngOnInit() {
    this.cargarHorarios();
  }

  cargarHorarios() {
    const estacionIdValue = this.estacionId();
    if (!estacionIdValue) {
      console.warn('No hay ID de estación configurado');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.horarioService.getHorariosByEstacion(estacionIdValue).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const horariosMap = new Map<number, IHorarioAtencion>();
          data.forEach(h => {
            if (h.diaSemana !== undefined) {
              horariosMap.set(parseInt(h.diaSemana), h);
            }
          });

          const horariosActualizados = this.horarios().map(dia => {
            const horarioBD = horariosMap.get(dia.diaSemana);
            if (horarioBD) {
              return {
                ...dia,
                id: horarioBD.id,
                activo: true,
                horaInicio: horarioBD.horaInicio,
                horaFin: horarioBD.horaFin
              };
            }
            return dia;
          });
          this.horarios.set(horariosActualizados);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al cargar los horarios');
        this.isLoading.set(false);
        console.error('Error al cargar horarios:', error);
      }
    });
  }

  toggleDia(dia: DiaHorario) {
    dia.activo = !dia.activo;
    this.horarios.set([...this.horarios()]);
  }

  guardarHorarios() {
    const estacionIdValue = this.estacionId();
    if (!estacionIdValue) {
      this.errorMessage.set('No se ha configurado el ID de la estación');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const horariosParaGuardar: Partial<IHorarioAtencion>[] = this.horarios()
      .filter(h => h.activo)
      .map(h => ({
        id: h.id,
        idEstacion: estacionIdValue,
        diaSemana: h.diaSemana.toString(),
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      }));

    this.horarioService.updateMultipleHorarios(horariosParaGuardar).subscribe({
      next: (horariosActualizados) => {
        const horariosMap = new Map<number, IHorarioAtencion>();
        horariosActualizados.forEach(h => {
          if (h.diaSemana) {
            horariosMap.set(parseInt(h.diaSemana), h);
          }
        });

        const horariosConIds = this.horarios().map(dia => {
          const horarioBD = horariosMap.get(dia.diaSemana);
          if (horarioBD) {
            return { ...dia, id: horarioBD.id };
          }
          return dia;
        });

        this.horarios.set(horariosConIds);
        this.successMessage.set('Horarios guardados correctamente');
        this.isLoading.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al guardar los horarios');
        this.isLoading.set(false);
        console.error('Error al guardar horarios:', error);
      }
    });
  }

  convertTo12Hour(time24: string): string {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
}
