import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FilasService } from '../../../services/fila-services';
import { CommonModule } from '@angular/common';
import { ICita } from '../../../domain/entities';
import { IServicio } from '../../../domain/entities/IServicio';

@Component({
  selector: 'app-appointment',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './appointment.html',
})
export class Appointment implements OnInit {
  @Input() servicios: IServicio[] = [];
  @Input() servicioPreseleccionadoId?: string;

  hora_inicio: string = '';
  hora_fin: string = '';
  servicio_seleccionado: string = '';
  duracion_servicio: number = 0;
  citas: ICita[] = [];
  loading = false;
  nuevaCitaForm: FormGroup;
  servicioPreseleccionado: IServicio | null = null;

  constructor(private FilasService: FilasService, private fb: FormBuilder) {
    this.nuevaCitaForm = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      servicio_id: ['', Validators.required],
      // Agrega otros campos según sea necesario
    });
  }

  ngOnInit(): void {
    this.cargarCitas();

    // Si hay un servicio preseleccionado, configurarlo automáticamente
    if (this.servicioPreseleccionadoId) {
      const servicio = this.servicios.find(s => s.id === this.servicioPreseleccionadoId);
      if (servicio) {
        this.servicioPreseleccionado = servicio;
        this.servicio_seleccionado = servicio.id;
        this.duracion_servicio = servicio.duracion_minutos || 0;
        this.nuevaCitaForm.patchValue({ servicio_id: servicio.id });
      }
    }
  }

  cargarCitas() {
    this.loading = true;
    this.FilasService.getCitas().subscribe({
      next: (data) => {
        this.citas = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  agregarCita() {


    this.FilasService.agregarCita(this.nuevaCitaForm.value).subscribe({
      next: (cita) => this.citas.push(cita),
      error: (err) => console.error('Error al agregar cita:', err, this.nuevaCitaForm.value),
    });
  }

  onServicioSeleccionado(event: Event): void {
    const servicioId = (event.target as HTMLSelectElement).value;
    const servicio = this.servicios.find(s => s.id === servicioId);

    if (servicio && servicio.duracion_minutos) {
      this.duracion_servicio = servicio.duracion_minutos;
      this.nuevaCitaForm.patchValue({ servicio_id: servicioId });

      // Si ya hay una hora de inicio, calcular automáticamente la hora de fin
      if (this.hora_inicio) {
        this.calcularHoraFin();
      }
    }
  }

  onHoraInicioChange(): void {
    this.nuevaCitaForm.patchValue({ hora_inicio: this.hora_inicio });

    // Si ya hay un servicio seleccionado, calcular la hora de fin
    if (this.duracion_servicio > 0) {
      this.calcularHoraFin();
    }
  }

  calcularHoraFin(): void {
    if (!this.hora_inicio || this.duracion_servicio === 0) {
      return;
    }

    // Convertir hora_inicio a Date
    const [horas, minutos] = this.hora_inicio.split(':').map(Number);
    const fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);

    // Agregar la duración del servicio
    fecha.setMinutes(fecha.getMinutes() + this.duracion_servicio);

    // Formatear la hora de fin como HH:MM
    const horaFin = fecha.getHours().toString().padStart(2, '0');
    const minutosFin = fecha.getMinutes().toString().padStart(2, '0');
    this.hora_fin = `${horaFin}:${minutosFin}`;

    this.nuevaCitaForm.patchValue({ hora_fin: this.hora_fin });
  }

}
