import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CitaService } from '../../../services/Rest/cita-services';
import { UserService } from '../../../services/Rest/userServices';
import { EstacionServices } from '../../../services/Rest/estacion-services';
import { HorarioService } from '../../../services/Rest/horario-services';
import { SuscripcionService } from '../../../services/Rest/suscripcion.service';
import { CommonModule } from '@angular/common';
import { ICita } from '../../../domain/entities';
import { IServicio } from '../../../domain/entities/IServicio';
import { IEstacion } from '../../../domain/entities/IEstacion';
import { IHorarioAtencion } from '../../../domain/entities/IHorarioAtencion';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './appointment.html',
})
export class Appointment implements OnInit, OnChanges {
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
  horariosAtencion: IHorarioAtencion[] = [];
  horasDisponibles: string[] = [];
  loading = false;
  cargandoCitas = false;
  cargandoHorarios = false;
  errorMessage: string = '';
  successMessage: string = '';
  nuevaCitaForm: FormGroup;
  servicioPreseleccionado: IServicio | null = null;
  estacionSeleccionadaId: string = '';

  private clienteId: string = '';
  usuarioEsPremium: boolean = false; // Expuesto para el template

  constructor(
    private citaService: CitaService, 
    private fb: FormBuilder,
    private userService: UserService,
    private estacionService: EstacionServices,
    private horarioService: HorarioService,
    private suscripcionService: SuscripcionService
  ) {
    this.nuevaCitaForm = this.fb.group({
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      servicio_id: ['', Validators.required],
      cliente_id: ['', Validators.required],
      negocio_id: ['', Validators.required],
      estacion_id: [{ value: '', disabled: true }, Validators.required], // Deshabilitado inicialmente
    });

    // Obtener el ID del usuario autenticado (cliente)
    const currentUser = this.userService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.clienteId = currentUser.id;
      // Valor inicial del localStorage (puede estar desactualizado)
      this.usuarioEsPremium = currentUser.es_premium || false;
      this.nuevaCitaForm.patchValue({ cliente_id: currentUser.id });
    }
  }

  ngOnInit(): void {
    // NO cargar citas al inicio - solo después de seleccionar servicio y estación

    // Configurar negocio_id si fue pasado como Input
    if (this.negocioId) {
      this.nuevaCitaForm.patchValue({ negocio_id: this.negocioId });
    }

    // Verificar estado premium del usuario con el servicio de suscripciones (fuente de verdad)
    if (this.clienteId) {
      this.verificarEstadoPremium();
    }

    // Inicializar servicio preseleccionado con un pequeño delay para asegurar que los inputs estén disponibles
    setTimeout(() => {
      this.inicializarServicioPreseleccionado();
    }, 0);
  }

  /**
   * Verifica el estado premium del usuario consultando el servicio de suscripciones
   */
  verificarEstadoPremium(): void {
    if (!this.clienteId) return;

    this.suscripcionService.verificarPremium(this.clienteId).subscribe({
      next: (verificacion) => {
        this.usuarioEsPremium = verificacion.es_premium || false;
      },
      error: (error) => {
        // Si falla la verificación, usar el valor del localStorage como fallback
        console.warn('Error verificando estado premium, usando valor del localStorage:', error);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando cambian los inputs, reinicializar
    if (changes['servicioPreseleccionadoId'] || changes['servicios'] || changes['negocioId']) {
      // Usar setTimeout para asegurar que los inputs estén completamente disponibles
      setTimeout(() => {
        this.inicializarServicioPreseleccionado();
      }, 0);
    }
  }

  inicializarServicioPreseleccionado(): void {
    // Limpiar estado previo si no hay servicio preseleccionado
    if (!this.servicioPreseleccionadoId) {
      this.servicioPreseleccionado = null;
      this.servicio_seleccionado = '';
      this.duracion_servicio = 0;
      this.estaciones = [];
      this.citas = [];
      this.horasDisponibles = [];
      return;
    }

    // Si hay un servicio preseleccionado, configurarlo automáticamente
    if (this.servicios && this.servicios.length > 0) {
      const servicio = this.servicios.find(s => s.id === this.servicioPreseleccionadoId);
      if (servicio) {
        this.servicioPreseleccionado = servicio;
        this.servicio_seleccionado = servicio.id;
        this.duracion_servicio = servicio.duracion_minutos || 0;
        this.nuevaCitaForm.patchValue({ 
          servicio_id: servicio.id,
          negocio_id: servicio.negocio_id || this.negocioId // Usar negocio_id del servicio o el input
        });
        // Cargar estaciones después de seleccionar servicio
        const negocioIdParaCargar = servicio.negocio_id || this.negocioId;
        if (negocioIdParaCargar) {
          this.negocioId = negocioIdParaCargar;
          this.cargarEstaciones();
        }
      }
    } else if (this.negocioId && !this.servicio_seleccionado) {
      // Si hay negocioId pero no servicio preseleccionado, solo configurar el negocio
      this.nuevaCitaForm.patchValue({ negocio_id: this.negocioId });
    }
  }

  cargarEstaciones() {
    if (!this.negocioId) return;
    
    this.estacionService.getEstacionesByNegocio(this.negocioId).subscribe({
      next: (data: IEstacion[]) => {
        // Filtrar solo estaciones activas
        // Las estaciones premium se mantienen en la lista pero no serán seleccionables
        this.estaciones = data.filter(e => e.estado === 'activa');
        
        // Habilitar el select de estaciones si hay estaciones disponibles
        if (this.estaciones.length > 0) {
          this.nuevaCitaForm.get('estacion_id')?.enable();
        } else {
          this.nuevaCitaForm.get('estacion_id')?.disable();
        }
      },
      error: (error) => {
        console.error('Error al cargar estaciones:', error);
        this.errorMessage = 'No se pudieron cargar las filas del negocio';
        this.nuevaCitaForm.get('estacion_id')?.disable();
      }
    });
  }

  /**
   * Verifica si una estación puede ser seleccionada por el usuario actual
   */
  puedeSeleccionarEstacion(estacion: IEstacion): boolean {
    // Si la estación es premium y el usuario no es premium, no puede seleccionarla
    if (estacion.solo_premium && !this.usuarioEsPremium) {
      return false;
    }
    return true;
  }

  /**
   * Verifica si hay estaciones premium disponibles pero el usuario no es premium
   */
  hayEstacionesPremiumNoDisponibles(): boolean {
    return this.estaciones.some(estacion => estacion.solo_premium && !this.usuarioEsPremium);
  }

  onEstacionSeleccionada(event: Event): void {
    const estacionId = (event.target as HTMLSelectElement).value;
    this.estacionSeleccionadaId = estacionId;
    this.nuevaCitaForm.patchValue({ estacion_id: estacionId });
    
    if (estacionId) {
      // Cargar citas de hoy para esta estación
      this.cargarCitas();
      // Cargar horarios de atención de la estación
      this.cargarHorariosAtencion(estacionId);
    } else {
      this.citas = [];
      this.horariosAtencion = [];
      this.horasDisponibles = [];
    }
  }

  cargarHorariosAtencion(estacionId: string): void {
    this.cargandoHorarios = true;
    this.horarioService.getHorariosByEstacion(estacionId).subscribe({
      next: (data: IHorarioAtencion[]) => {
        this.horariosAtencion = data;
        this.cargandoHorarios = false;
        // Recalcular horas disponibles si las citas ya están cargadas
        if (!this.cargandoCitas) {
          this.calcularHorasDisponibles();
        }
      },
      error: (error) => {
        console.error('Error al cargar horarios de atención:', error);
        this.errorMessage = 'No se pudieron cargar los horarios de atención';
        this.cargandoHorarios = false;
      }
    });
  }

  cargarCitas() {
    if (!this.estacionSeleccionadaId) return;
    
    this.cargandoCitas = true;
    this.loading = true;
    const fechaHoy = new Date().toISOString().split('T')[0];
    
    // Cargar solo las citas de hoy para esta estación
    this.citaService.getCitasByEstacion(this.estacionSeleccionadaId).subscribe({
      next: (data: ICita[]) => {
        // Filtrar solo las citas de hoy
        this.citas = data.filter(cita => {
          const citaFecha = new Date(cita.fecha).toISOString().split('T')[0];
          return citaFecha === fechaHoy;
        });
        this.cargandoCitas = false;
        this.loading = false;
        // Recalcular horas disponibles después de cargar citas (solo si los horarios ya están cargados)
        if (!this.cargandoHorarios) {
          this.calcularHorasDisponibles();
        }
      },
      error: () => {
        this.cargandoCitas = false;
        this.loading = false;
        this.citas = [];
      },
    });
  }

  calcularHorasDisponibles(): void {
    if (!this.estacionSeleccionadaId || !this.duracion_servicio || this.horariosAtencion.length === 0) {
      this.horasDisponibles = [];
      return;
    }

    // Obtener el día de la semana actual (0 = Domingo, 6 = Sábado)
    const hoy = new Date();
    const diaSemana = hoy.getDay();

    // Buscar el horario de atención para hoy
    const horarioHoy = this.horariosAtencion.find(h => h.dia_semana === diaSemana);
    
    if (!horarioHoy) {
      this.horasDisponibles = [];
      return;
    }

    // Generar todas las horas posibles dentro del horario de atención
    const horas: string[] = [];
    const [horaInicio, minutoInicio] = horarioHoy.hora_inicio.split(':').map(Number);
    const [horaFin, minutoFin] = horarioHoy.hora_fin.split(':').map(Number);

    // Obtener la hora actual para filtrar horas pasadas
    const horaActualDelDia = hoy.getHours();
    const minutoActualDelDia = hoy.getMinutes();

    let horaIteracion = horaInicio;
    let minutoIteracion = minutoInicio;

    while (horaIteracion < horaFin || (horaIteracion === horaFin && minutoIteracion < minutoFin)) {
      const horaStr = `${horaIteracion.toString().padStart(2, '0')}:${minutoIteracion.toString().padStart(2, '0')}`;
      
      // Verificar que la hora no haya pasado (solo mostrar horas futuras)
      const esHoraFutura = horaIteracion > horaActualDelDia || 
                          (horaIteracion === horaActualDelDia && minutoIteracion > minutoActualDelDia);
      
      // Excluir horas desde las 12:00 PM hasta las 1:30 PM (horario de almuerzo)
      const estaEnHorarioAlmuerzo = this.estaEnHorarioAlmuerzo(horaStr);
      
      // Verificar que esta hora no se solape con ninguna cita existente, no esté en horario de almuerzo
      // y sea una hora futura
      if (esHoraFutura && !estaEnHorarioAlmuerzo && this.esHoraDisponible(horaStr)) {
        horas.push(horaStr);
      }

      // Avanzar en intervalos de 15 minutos
      minutoIteracion += 15;
      if (minutoIteracion >= 60) {
        minutoIteracion = 0;
        horaIteracion++;
      }
    }

    this.horasDisponibles = horas;
  }

  estaEnHorarioAlmuerzo(horaInicio: string): boolean {
    // Verificar si la hora está en el rango de 12:00 PM a 1:30 PM
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const minutosTotales = horas * 60 + minutos;
    
    // 12:00 PM = 12 * 60 = 720 minutos
    // 1:30 PM = 13 * 60 + 30 = 810 minutos
    return minutosTotales >= 720 && minutosTotales < 810;
  }

  esHoraDisponible(horaInicio: string): boolean {
    if (!this.duracion_servicio) return false;

    // Verificar que no esté en horario de almuerzo
    if (this.estaEnHorarioAlmuerzo(horaInicio)) {
      return false;
    }

    // Calcular hora de fin para esta cita
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const fechaInicio = new Date();
    fechaInicio.setHours(horas, minutos, 0, 0);
    
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(fechaFin.getMinutes() + this.duracion_servicio);
    
    const horaFin = `${fechaFin.getHours().toString().padStart(2, '0')}:${fechaFin.getMinutes().toString().padStart(2, '0')}`;

    // Verificar que la hora de fin tampoco esté en horario de almuerzo
    if (this.estaEnHorarioAlmuerzo(horaFin)) {
      return false;
    }

    // Verificar que no se solape con ninguna cita existente
    for (const cita of this.citas) {
      if (cita.estado === 'cancelada') continue; // Ignorar citas canceladas

      const citaInicio = cita.hora_inicio;
      const citaFin = cita.hora_fin;

      // Verificar solapamiento: la nueva cita no debe empezar antes de que termine una existente
      // ni terminar después de que empiece una existente
      if (
        (horaInicio >= citaInicio && horaInicio < citaFin) ||
        (horaFin > citaInicio && horaFin <= citaFin) ||
        (horaInicio <= citaInicio && horaFin >= citaFin)
      ) {
        return false;
      }
    }

    return true;
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
        
        // Recargar citas y recalcular horas disponibles
        this.cargarCitas();
        
        // Limpiar solo hora de inicio y fin
        this.nuevaCitaForm.patchValue({
          hora_inicio: '',
          hora_fin: ''
        });
        this.hora_inicio = '';
        this.hora_fin = '';
        
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
      this.servicio_seleccionado = servicioId;
      this.duracion_servicio = servicio.duracion_minutos;
      this.nuevaCitaForm.patchValue({ 
        servicio_id: servicioId,
        negocio_id: servicio.negocio_id
      });

      // Limpiar selección de estación y citas
      this.estacionSeleccionadaId = '';
      this.nuevaCitaForm.patchValue({ estacion_id: '' });
      this.citas = [];
      this.horasDisponibles = [];
      this.hora_inicio = '';
      this.hora_fin = '';

      // Cargar estaciones del negocio
      if (servicio.negocio_id) {
        this.negocioId = servicio.negocio_id;
        this.cargarEstaciones();
      }
    }
  }

  onHoraInicioChange(): void {
    this.nuevaCitaForm.patchValue({ hora_inicio: this.hora_inicio });

    // Calcular la hora de fin basándose en la duración del servicio
    if (this.duracion_servicio > 0 && this.hora_inicio) {
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
