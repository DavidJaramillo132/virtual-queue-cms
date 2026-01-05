import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuscripcionService, CrearSuscripcionRequest, PlanesInfoResponse } from '../../services/Rest/suscripcion.service';
import { ISuscripcion, IPlanSuscripcion, IVerificarPremium } from '../../domain/entities/INegocio';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../services/Rest/userServices';

@Component({
  selector: 'app-suscripcion-premium',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suscripcion-premium.html'
})
export class SuscripcionPremiumComponent implements OnInit {
  @Input() usuarioId?: string;
  
  suscripcion: ISuscripcion | null = null;
  verificacionPremium: IVerificarPremium | null = null;
  planes: IPlanSuscripcion[] = [];
  cargando = false;
  error: string | null = null;
  mostrarModalCancelar = false;

  constructor(
    private suscripcionService: SuscripcionService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Si no se pasó usuarioId como Input, obtenerlo del usuario autenticado
    if (!this.usuarioId) {
      const currentUser = this.userService.currentUserValue;
      if (currentUser && currentUser.id) {
        this.usuarioId = currentUser.id;
      } else {
        this.error = 'Usuario no autenticado';
        return;
      }
    }
    
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    // Cargar planes disponibles
    this.suscripcionService.obtenerInfoPlanes().subscribe({
      next: (response: PlanesInfoResponse) => {
        this.planes = response.planes;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error cargando planes:', err);
      }
    });

    // Verificar estado premium del usuario
    if (this.usuarioId) {
      this.suscripcionService.verificarPremium(this.usuarioId).subscribe({
        next: (verificacion: IVerificarPremium) => {
          this.verificacionPremium = verificacion;
          if (verificacion.es_premium) {
            this.cargarSuscripcion();
          } else {
            this.cargando = false;
          }
        },
        error: (err: HttpErrorResponse) => {
          this.cargando = false;
          console.error('Error verificando premium:', err);
        }
      });
    } else {
      this.cargando = false;
    }
  }

  cargarSuscripcion(): void {
    this.suscripcionService.obtenerSuscripcionPorUsuario(this.usuarioId!).subscribe({
      next: (suscripcion: ISuscripcion) => {
        this.suscripcion = suscripcion;
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        console.error('Error cargando suscripcion:', err);
      }
    });
  }

  suscribirsePremium(conPruebaGratis: boolean = true): void {
    if (!this.usuarioId) {
      this.error = 'ID de usuario no disponible';
      console.error('usuarioId no está definido:', this.usuarioId);
      return;
    }

    this.cargando = true;
    this.error = null;

    const request: CrearSuscripcionRequest = {
      usuario_id: this.usuarioId,
      tipo: 'premium',
      con_prueba_gratis: conPruebaGratis
    };

    console.log('Creando suscripción para usuario:', this.usuarioId, 'Request:', request);

    this.suscripcionService.crearSuscripcion(request).subscribe({
      next: (suscripcion: ISuscripcion) => {
        this.suscripcion = suscripcion;
        this.verificacionPremium = {
          usuario_id: this.usuarioId!,
          es_premium: true,
          tipo_suscripcion: suscripcion.tipo,
          estado: suscripcion.estado,
          beneficios: suscripcion.beneficios,
          fecha_vencimiento: suscripcion.fecha_proximo_cobro,
          nivel_prioridad: 1 // VIP
        };
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = err.error?.detail || 'Error al crear suscripcion';
      }
    });
  }

  cancelarSuscripcion(inmediatamente: boolean = false): void {
    if (!this.suscripcion) return;

    this.cargando = true;
    this.error = null;

    this.suscripcionService.cancelarSuscripcion({
      suscripcion_id: this.suscripcion.id,
      cancelar_inmediatamente: inmediatamente
    }).subscribe({
      next: (suscripcion: ISuscripcion) => {
        this.suscripcion = suscripcion;
        if (inmediatamente) {
          this.verificacionPremium = {
            usuario_id: this.usuarioId!,
            es_premium: false,
            nivel_prioridad: 5 // Normal
          };
        }
        this.cargando = false;
        this.mostrarModalCancelar = false;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = err.error?.detail || 'Error al cancelar suscripcion';
      }
    });
  }

  abrirModalCancelar(): void {
    this.mostrarModalCancelar = true;
  }

  cerrarModalCancelar(): void {
    this.mostrarModalCancelar = false;
  }

  get esPremiumActivo(): boolean {
    return this.verificacionPremium?.es_premium ?? false;
  }

  get estadoSuscripcion(): string {
    if (!this.suscripcion) return 'Sin suscripcion';
    
    const estados: Record<string, string> = {
      'prueba': 'Periodo de prueba',
      'activa': 'Activa',
      'pausada': 'Pausada',
      'cancelada': 'Cancelada',
      'vencida': 'Vencida'
    };
    
    return estados[this.suscripcion.estado] || this.suscripcion.estado;
  }

  get diasRestantes(): number {
    if (!this.suscripcion?.fecha_proximo_cobro) return 0;
    
    const hoy = new Date();
    const proximoCobro = new Date(this.suscripcion.fecha_proximo_cobro);
    const diferencia = proximoCobro.getTime() - hoy.getTime();
    
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }
}
