import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CitaService } from '../../../services/Rest/cita-services';
import { UserService } from '../../../services/Rest/userServices';
import { EstacionServices } from '../../../services/Rest/estacion-services';
import { CommonModule } from '@angular/common';
import { ICita } from '../../../domain/entities';
import { IServicio } from '../../../domain/entities/IServicio';
import { IEstacion } from '../../../domain/entities/IEstacion';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './appointment.html',
})
export class Appointment implements OnInit {
  @Input() servicios: IServicio[] = [];
  @Input() servicioPreseleccionadoId?: string;
  @Input() negocioId?: string; // ID del negocio al que pertenece el servicio
  @Input() estacionId?: string; // ID de la estación (opcional)

  hora_inicio: string = '';
  hora_fin: string = '';
  servicio_seleccionado: string = '';
  duracion_servicio: number = 0;
  citas: ICita[] = [];
  estaciones: IEstacion[] = [];
  loading = false;
  errorMessage: string = '';
  successMessage: string = '';
  nuevaCitaForm: FormGroup;
  servicioPreseleccionado: IServicio | null = null;

  private clienteId: string = '';

  constructor(
    private citaService: CitaService, 
    private fb: FormBuilder,
    private userService: UserService,
    private estacionService: EstacionServices
  ) {
    this.nuevaCitaForm = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      servicio_id: ['', Validators.required],
      cliente_id: ['', Validators.required],
      negocio_id: ['', Validators.required],
      estacion_id: ['', Validators.required], // REQUERIDO - cada cita debe tener una estación (fila)
    });

    // Obtener el ID del usuario autenticado (cliente)
    const currentUser = this.userService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.clienteId = currentUser.id;
      this.nuevaCitaForm.patchValue({ cliente_id: currentUser.id });
    }
  }

  ngOnInit(): void {
    this.cargarCitas();

    // Configurar negocio_id si fue pasado como Input
    if (this.negocioId) {
      this.nuevaCitaForm.patchValue({ negocio_id: this.negocioId });
      // Cargar las estaciones (filas) del negocio
      this.cargarEstaciones();
    }

    // Configurar estacion_id si fue pasado como Input
    if (this.estacionId) {
      this.nuevaCitaForm.patchValue({ estacion_id: this.estacionId });
    }

    // Si hay un servicio preseleccionado, configurarlo automáticamente
    if (this.servicioPreseleccionadoId) {
      const servicio = this.servicios.find(s => s.id === this.servicioPreseleccionadoId);
      if (servicio) {
        this.servicioPreseleccionado = servicio;
        this.servicio_seleccionado = servicio.id;
        this.duracion_servicio = servicio.duracion_minutos || 0;
        this.nuevaCitaForm.patchValue({ 
          servicio_id: servicio.id,
          negocio_id: servicio.negocio_id // Obtener negocio_id del servicio
        });
      }
    }
  }

  cargarEstaciones() {
    if (!this.negocioId) return;
    
    this.estacionService.getEstacionesByNegocio(this.negocioId).subscribe({
      next: (data: IEstacion[]) => {
        // Filtrar solo estaciones activas
        this.estaciones = data.filter(e => e.estado === 'activa');
        
        // Si solo hay una estación, seleccionarla automáticamente
        if (this.estaciones.length === 1 && !this.estacionId) {
          this.nuevaCitaForm.patchValue({ estacion_id: this.estaciones[0].id });
        }
      },
      error: (error) => {
        console.error('Error al cargar estaciones:', error);
        this.errorMessage = 'No se pudieron cargar las filas del negocio';
      }
    });
  }

  cargarCitas() {
    this.loading = true;
    
    // Si hay negocioId, cargar solo las citas de ese negocio
    if (this.negocioId) {
      this.citaService.getCitasByNegocio(this.negocioId).subscribe({
        next: (data: ICita[]) => {
          this.citas = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    } 
    // Si hay estacionId, cargar solo las citas de esa estación
    else if (this.estacionId) {
      this.citaService.getCitasByEstacion(this.estacionId).subscribe({
        next: (data: ICita[]) => {
          this.citas = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
    // Si no hay filtros, cargar todas (para admin)
    else {
      this.citaService.getAllCitas().subscribe({
        next: (data: ICita[]) => {
          this.citas = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }

  agregarCita() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validar el formulario
    if (this.nuevaCitaForm.invalid) {
      this.errorMessage = 'Por favor complete todos los campos requeridos';
      return;
    }

    // Validar que tenga los campos obligatorios incluyendo estacion_id
    const citaData = this.nuevaCitaForm.value;
    if (!citaData.cliente_id || !citaData.negocio_id || !citaData.servicio_id || !citaData.estacion_id) {
      this.errorMessage = 'Faltan campos obligatorios. Por favor, seleccione una fila (estación).';
      console.error('Datos del formulario:', citaData);
      return;
    }

    this.loading = true;
    this.citaService.createCita(citaData).subscribe({
      next: (cita: ICita) => {
        this.citas.push(cita);
        this.successMessage = 'Cita agendada exitosamente';
        this.loading = false;
        
        // Limpiar formulario (mantener cliente_id y negocio_id)
        this.nuevaCitaForm.patchValue({
          hora_inicio: '',
          hora_fin: '',
          servicio_id: ''
        });
        this.hora_inicio = '';
        this.hora_fin = '';
        this.servicio_seleccionado = '';
        
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Error al agendar la cita';
        this.loading = false;
        console.error('Error al agregar cita:', err, citaData);
      },
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
