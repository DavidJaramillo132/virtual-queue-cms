import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorarioService } from '../../../services/Rest/horario-services';
import { EstacionServices } from '../../../services/Rest/estacion-services';
import { UserService } from '../../../services/Rest/userServices';
import { IHorarioAtencion, IEstacion } from '../../../domain/entities';

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

  estaciones = signal<IEstacion[]>([]);
  estacionSeleccionada = signal<string>('');
  
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  
  private negocioId: string = '';

  constructor(
    private horarioService: HorarioService,
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
    if (this.negocioId) {
      this.cargarEstaciones();
    } else {
      this.errorMessage.set('No se encontró información del negocio. Por favor, inicie sesión nuevamente.');
    }
  }

  cargarEstaciones() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.estacionService.getEstacionesByNegocio(this.negocioId).subscribe({
      next: (data: IEstacion[]) => {
        this.estaciones.set(data);
        if (data.length > 0) {
          // Seleccionar la primera estación por defecto
          this.estacionSeleccionada.set(data[0].id);
          this.cargarHorarios();
        } else {
          this.errorMessage.set('No hay estaciones configuradas para este negocio');
          this.isLoading.set(false);
        }
      },
      error: (error: any) => {
        this.errorMessage.set(error.message || 'Error al cargar las estaciones');
        this.isLoading.set(false);
        console.error('Error al cargar estaciones:', error);
      }
    });
  }

  onEstacionChange() {
    this.cargarHorarios();
  }

  cargarHorarios() {
    const estacionIdValue = this.estacionSeleccionada();
    if (!estacionIdValue) {
      console.warn('No hay ID de estación seleccionado');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    // Resetear horarios a valores por defecto
    this.horarios.set([
      { dia: 'Domingo', diaSemana: 0, activo: false, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Lunes', diaSemana: 1, activo: false, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Martes', diaSemana: 2, activo: false, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Miércoles', diaSemana: 3, activo: false, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Jueves', diaSemana: 4, activo: false, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Viernes', diaSemana: 5, activo: false, horaInicio: '09:00', horaFin: '18:00' },
      { dia: 'Sábado', diaSemana: 6, activo: false, horaInicio: '09:00', horaFin: '18:00' }
    ]);
    
    this.horarioService.getHorariosByEstacion(estacionIdValue).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const horariosMap = new Map<number, IHorarioAtencion>();
          data.forEach(h => {
            if (h.dia_semana !== undefined) {
              horariosMap.set(h.dia_semana, h);
            }
          });

          const horariosActualizados = this.horarios().map(dia => {
            const horarioBD = horariosMap.get(dia.diaSemana);
            if (horarioBD) {
              return {
                ...dia,
                id: horarioBD.id,
                activo: true,
                horaInicio: horarioBD.hora_inicio,
                horaFin: horarioBD.hora_fin
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

  async guardarHorarios() {
    const estacionIdValue = this.estacionSeleccionada();
    if (!estacionIdValue) {
      this.errorMessage.set('No se ha seleccionado una estación');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      // Primero, eliminar los horarios inactivos
      const horariosInactivos = this.horarios().filter(h => !h.activo && h.id);
      for (const horario of horariosInactivos) {
        if (horario.id) {
          await this.horarioService.deleteHorario(horario.id).toPromise();
        }
      }

      // Luego, crear o actualizar los horarios activos
      const horariosActivos = this.horarios().filter(h => h.activo);
      for (const horario of horariosActivos) {
        const horarioData: Partial<IHorarioAtencion> = {
          estacion_id: estacionIdValue,
          dia_semana: horario.diaSemana,
          hora_inicio: horario.horaInicio,
          hora_fin: horario.horaFin
        };

        if (horario.id) {
          // Actualizar existente
          await this.horarioService.updateHorario(horario.id, horarioData).toPromise();
        } else {
          // Crear nuevo
          const nuevoHorario = await this.horarioService.createHorario(horarioData).toPromise();
          if (nuevoHorario) {
            horario.id = nuevoHorario.id;
          }
        }
      }

      this.successMessage.set('Horarios guardados correctamente');
      this.isLoading.set(false);
      
      // Recargar horarios para sincronizar
      this.cargarHorarios();
      
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al guardar los horarios');
      this.isLoading.set(false);
      console.error('Error al guardar horarios:', error);
    }
  }

  convertTo12Hour(time24: string): string {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
}
