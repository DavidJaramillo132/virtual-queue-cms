import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CitaService } from '../../../services/Rest/cita-services';
import { UserService } from '../../../services/Rest/userServices';
import { ServicioServicios } from '../../../services/Rest/servicio-servicios';
import { ICita } from '../../../domain/entities';

interface CitaExtendida extends ICita {
  nombreCliente?: string;
  nombreServicio?: string;
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
  private negocioId: string = '';

  constructor(
    private citaService: CitaService,
    private userService: UserService,
    private servicioService: ServicioServicios
  ) {
    // Obtener el negocio_id del usuario autenticado
    const currentUser = this.userService.currentUserValue;
    if (currentUser && currentUser.negocio_id) {
      this.negocioId = currentUser.negocio_id;
    }
  }

  ngOnInit() {
    this.cargarCitas();
  }

  cargarCitas() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    if (!this.negocioId) {
      this.errorMessage.set('No se encontró el negocio del usuario');
      this.isLoading.set(false);
      return;
    }
    
    // Cargar solo las citas del negocio del usuario
    this.citaService.getCitasByNegocio(this.negocioId).subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.citas.set([]);
          this.isLoading.set(false);
          return;
        }

        // Obtener IDs únicos de servicios y clientes
        const serviciosIds = [...new Set(data.map(c => c.servicio_id))];
        const clientesIds = [...new Set(data.map(c => c.cliente_id))];

        // Cargar todos los servicios en paralelo
        const serviciosRequests = serviciosIds.length > 0
          ? serviciosIds.map(id => 
              this.servicioService.getServicioById(id).pipe(
                catchError(err => {
                  console.error(`Error cargando servicio ${id}:`, err);
                  return of({ id, nombre: 'Servicio no disponible' } as any);
                })
              )
            )
          : [];

        // Cargar todos los usuarios una vez (más eficiente)
        const usuariosObservable = this.userService.getUsuarios().pipe(
          catchError(err => {
            console.error('Error cargando usuarios:', err);
            return of([]);
          })
        );

        // Combinar todas las peticiones
        const serviciosObservable = serviciosIds.length > 0
          ? forkJoin(serviciosRequests)
          : of([]);

        forkJoin({
          servicios: serviciosObservable,
          usuarios: usuariosObservable
        }).subscribe({
          next: ({ servicios, usuarios }) => {
            // Crear mapas para acceso rápido
            const serviciosMap = new Map();
            const clientesMap = new Map();

            if (Array.isArray(servicios) && servicios.length > 0) {
              servicios.forEach((s: any) => {
                if (s && s.id) {
                  serviciosMap.set(String(s.id), s.nombre || 'Servicio sin nombre');
                }
              });
            }

            // Crear mapa de clientes desde el array de usuarios
            if (Array.isArray(usuarios) && usuarios.length > 0) {
              // Normalizar IDs de clientes a strings para comparación
              const clientesIdsStr = clientesIds.map(id => String(id));
              
              console.log(' Depuración - IDs de clientes buscados:', clientesIdsStr);
              console.log(' Depuración - Usuarios recibidos:', usuarios.map((u: any) => ({
                id: String(u.id),
                nombre_completo: u.nombre_completo,
                email: u.email
              })));
              
              usuarios.forEach((u: any) => {
                if (u && u.id) {
                  const userId = String(u.id);
                  
                  // Verificar si este usuario es uno de los clientes que necesitamos
                  if (clientesIdsStr.includes(userId)) {
                    // El backend devuelve nombre_completo (snake_case)
                    // Intentar obtener el nombre completo de diferentes formas
                    const nombreCompleto = u.nombre_completo || 
                                          (u as any).nombreCompleto || 
                                          u.nombre || 
                                          '';
                    
                    if (nombreCompleto && nombreCompleto.trim() !== '') {
                      clientesMap.set(userId, nombreCompleto);
                      console.log(` Cliente mapeado: ${userId} -> ${nombreCompleto}`);
                    } else {
                      console.warn(` Cliente ${userId} sin nombre_completo. Datos:`, u);
                    }
                  }
                }
              });
              
              console.log(' Mapa de clientes final:', Array.from(clientesMap.entries()));
            } else {
              console.warn(' No se recibieron usuarios o el array está vacío');
            }

            // Enriquecer las citas con los nombres
            const citasEnriquecidas = data.map(cita => {
              const servicioId = String(cita.servicio_id);
              const clienteId = String(cita.cliente_id);
              
              const nombreServicio = serviciosMap.get(servicioId) || 'Servicio no disponible';
              const nombreCliente = clientesMap.get(clienteId) || 'Cliente no disponible';
              
              return {
                ...cita,
                nombreServicio,
                nombreCliente
              };
            });

            this.citas.set(citasEnriquecidas);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error cargando datos adicionales:', error);
            // Aún así mostrar las citas sin los nombres
            const citasEnriquecidas = data.map(cita => ({
              ...cita,
              nombreServicio: 'No disponible',
              nombreCliente: 'No disponible'
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
