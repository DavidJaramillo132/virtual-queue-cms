import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CitaService } from '../../services/Rest/cita-services';
import { UserService } from '../../services/Rest/userServices';
import { NegocioServices } from '../../services/Rest/negocio-services';
import { ServicioServicios } from '../../services/Rest/servicio-servicios';
import { ICita } from '../../domain/entities';

interface CitaExtendida extends ICita {
  nombreNegocio?: string;
  nombreServicio?: string;
}

@Component({
  selector: 'app-citas-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas-usuario.html',
  styleUrls: ['./citas-usuario.css']
})
export class CitasUsuario implements OnInit {
  filtroEstado = signal<string>('todas');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  citas = signal<CitaExtendida[]>([]);
  private clienteId: string = '';

  constructor(
    private citaService: CitaService,
    private userService: UserService,
    private negocioService: NegocioServices,
    private servicioService: ServicioServicios,
    private router: Router
  ) {
    // Obtener el ID del usuario cliente autenticado
    const currentUser = this.userService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.clienteId = currentUser.id;
    } else {
      // Si no hay usuario, redirigir al login
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.cargarCitas();
  }

  cargarCitas() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    if (!this.clienteId) {
      this.errorMessage.set('No se encontró el usuario');
      this.isLoading.set(false);
      return;
    }
    
    // Cargar solo las citas del cliente
    this.citaService.getCitasByCliente(this.clienteId).subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.citas.set([]);
          this.isLoading.set(false);
          return;
        }

        // Obtener IDs únicos de negocios y servicios
        const negociosIds = [...new Set(data.map(c => c.negocio_id))];
        const serviciosIds = [...new Set(data.map(c => c.servicio_id))];

        // Cargar todos los negocios y servicios en paralelo
        const negociosRequests = negociosIds.length > 0 
          ? negociosIds.map(id => 
              this.negocioService.getNegocioById(id).pipe(
                catchError(err => {
                  console.error(`Error cargando negocio ${id}:`, err);
                  return of({ id, nombre: 'Negocio no disponible' } as any);
                })
              )
            )
          : [of([])];

        const serviciosRequests = serviciosIds.length > 0
          ? serviciosIds.map(id => 
              this.servicioService.getServicioById(id).pipe(
                catchError(err => {
                  console.error(`Error cargando servicio ${id}:`, err);
                  return of({ id, nombre: 'Servicio no disponible' } as any);
                })
              )
            )
          : [of([])];

        // Combinar todas las peticiones
        const negociosObservable = negociosIds.length > 0 
          ? forkJoin(negociosRequests) 
          : of([]);
        
        const serviciosObservable = serviciosIds.length > 0
          ? forkJoin(serviciosRequests)
          : of([]);

        forkJoin({
          negocios: negociosObservable,
          servicios: serviciosObservable
        }).subscribe({
          next: ({ negocios, servicios }) => {
            // Crear mapas para acceso rápido
            const negociosMap = new Map();
            const serviciosMap = new Map();

            if (Array.isArray(negocios) && negocios.length > 0) {
              negocios.forEach((n: any) => {
                if (n && n.id) {
                  negociosMap.set(n.id, n.nombre || 'Negocio sin nombre');
                }
              });
            }

            if (Array.isArray(servicios) && servicios.length > 0) {
              servicios.forEach((s: any) => {
                if (s && s.id) {
                  serviciosMap.set(s.id, s.nombre || 'Servicio sin nombre');
                }
              });
            }

            // Enriquecer las citas con los nombres
            const citasEnriquecidas = data.map(cita => ({
              ...cita,
              nombreNegocio: negociosMap.get(cita.negocio_id) || 'Negocio no disponible',
              nombreServicio: serviciosMap.get(cita.servicio_id) || 'Servicio no disponible'
            }));

            this.citas.set(citasEnriquecidas);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error cargando datos adicionales:', error);
            // Aún así mostrar las citas sin los nombres
            const citasEnriquecidas = data.map(cita => ({
              ...cita,
              nombreNegocio: 'No disponible',
              nombreServicio: 'No disponible'
            }));
            this.citas.set(citasEnriquecidas);
            this.isLoading.set(false);
          }
        });
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

  cancelarCita(cita: CitaExtendida) {
    if (confirm('¿Estás seguro de cancelar esta cita?')) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.citaService.updateEstadoCita(cita.id, 'cancelada').subscribe({
        next: (citaActualizada) => {
          const citasActualizadas = this.citas().map(c => 
            c.id === cita.id ? { ...c, estado: citaActualizada.estado } : c
          );
          this.citas.set(citasActualizadas);
          this.isLoading.set(false);
          alert('Cita cancelada correctamente');
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Error al cancelar la cita');
          this.isLoading.set(false);
          console.error('Error al cancelar cita:', error);
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
    if (!fecha) return 'No disponible';
    try {
      const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  formatearHora(hora: string): string {
    if (!hora) return 'No disponible';
    return hora;
  }
}
