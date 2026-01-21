import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SuscripcionService, CrearSuscripcionRequest, PlanesInfoResponse } from '../../services/Rest/suscripcion.service';
import { PagosService, CrearPagoRequest } from '../../services/Rest/pagos.service';
import { DescuentoService, IDescuento } from '../../services/Rest/descuento.service';
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
  descuentos: IDescuento[] = [];
  descuentoActivo: IDescuento | null = null;
  precioConDescuento: number | null = null;
  cargando = false;
  error: string | null = null;
  mostrarModalCancelar = false;
  mostrarModalPago = false;
  mensajeExito: string | null = null;

  constructor(
    private suscripcionService: SuscripcionService,
    private pagosService: PagosService,
    private descuentoService: DescuentoService,
    private userService: UserService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    console.log('🔄🔄🔄 ===== COMPONENTE INICIADO ===== 🔄🔄🔄');
    console.log('📍 URL completa:', window.location.href);
    console.log('📍 Pathname:', window.location.pathname);
    console.log('📍 Search params:', window.location.search);

    // Si no se pasó usuarioId como Input, obtenerlo del usuario autenticado
    if (!this.usuarioId) {
      const currentUser = this.userService.currentUserValue;
      console.log('👤 Current user:', currentUser);
      if (currentUser && currentUser.id) {
        this.usuarioId = currentUser.id;
        console.log('✅ Usuario ID obtenido:', this.usuarioId);
      } else {
        console.error('❌ Usuario no autenticado');
        this.error = 'Usuario no autenticado';
        return;
      }
    }

    // PRIMERO: Verificar parámetros en la URL antes de que se procese cualquier otra cosa
    console.log('🔍 Suscribiéndose a queryParams...');
    this.route.queryParams.subscribe(params => {
      console.log('🔍🔍🔍 ===== QUERY PARAMS RECIBIDOS ===== 🔍🔍🔍');
      console.log('Objeto completo:', JSON.stringify(params, null, 2));
      console.log('Keys:', Object.keys(params));
      console.log('Valor de "pago":', params['pago']);
      console.log('Tipo de "pago":', typeof params['pago']);
      console.log('Valor de "session_id":', params['session_id']);

      if (params['pago'] === 'exitoso') {
        console.log('✅✅✅ ===== PAGO EXITOSO DETECTADO ===== ✅✅✅');
        this.mensajeExito = '¡Pago completado exitosamente! Creando tu suscripción Premium...';
        this.cargando = true;

        // Crear la suscripción INMEDIATAMENTE
        console.log('🚀🚀🚀 Llamando a crearSuscripcionDespuesDePago()...');
        this.crearSuscripcionDespuesDePago();

        // No cargar datos normales si viene de pago
        console.log('⏹️ No cargando datos normales (es callback de pago)');
        return;
      } else if (params['pago'] === 'cancelado') {
        console.log('❌ Pago cancelado por el usuario');
        this.error = 'Pago cancelado. Puedes intentarlo nuevamente cuando desees.';
      } else {
        console.log('ℹ️ Sin parámetros de pago - carga normal');
      }

      // Solo cargar datos si NO viene de un pago exitoso
      console.log('📥 Cargando datos normales...');
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    // Cargar planes disponibles
    this.suscripcionService.obtenerInfoPlanes().subscribe({
      next: (response: PlanesInfoResponse) => {
        this.planes = response.planes;
        // Recalcular descuentos si ya se cargaron los planes
        if (this.descuentos.length > 0) {
          this.cargarDescuentos(); // Recargar para usar el precio correcto del plan
        }
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

    // Cargar descuentos del usuario
    if (this.usuarioId) {
      this.cargarDescuentos();
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

  cargarDescuentos(): void {
    if (!this.usuarioId) return;

    // Obtener email del usuario actual
    const currentUser = this.userService.currentUserValue;
    const email = currentUser?.email || 'ugabituna@gmail.com'; // Fallback para test

    // Primero intentar reclamar descuentos pendientes
    console.log(`🔍 Intentando reclamar descuentos para: ${email}`);
    this.descuentoService.reclamarDescuentosPendientes(this.usuarioId, email).subscribe({
      next: (res) => {
        if (res.descuentos_reclamados > 0) {
          console.log(`✅ Se reclamaron ${res.descuentos_reclamados} descuentos pendientes!`);
          this.mensajeExito = `¡Se han activado ${res.descuentos_reclamados} descuentos pendientes!`;
        }
        this.cargarListaDescuentos();
      },
      error: (err) => {
        console.warn('No se pudieron reclamar descuentos', err);
        this.cargarListaDescuentos();
      }
    });
  }

  cargarListaDescuentos(): void {
    if (!this.usuarioId) return;

    this.descuentoService.obtenerDescuentosUsuario(this.usuarioId).subscribe({
      next: (response) => {
        this.descuentos = response.descuentos || [];

        // Calcular precio con descuento para el plan Premium
        const planPremium = this.planes.find(p => p.tipo === 'premium');
        const precioOriginal = planPremium?.precio_mensual || 29.99;

        const calculo = this.descuentoService.calcularPrecioConDescuento(precioOriginal, this.descuentos);

        this.precioConDescuento = calculo.precioFinal;
        this.descuentoActivo = calculo.descuentoAplicado;

        if (this.descuentoActivo) {
          console.log(`🎉 Descuento aplicado: ${this.descuentoActivo.porcentaje}% (${this.descuentoActivo.evento_origen})`);
        }
      },
      error: (err) => {
        console.error('Error cargando descuentos:', err);
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

    // Si NO tiene prueba gratis, crear pago primero
    if (!conPruebaGratis) {
      this.crearPagoSuscripcion();
      return;
    }

    // Con prueba gratis, crear directamente la suscripción
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

  crearPagoSuscripcion(): void {
    if (!this.usuarioId) return;

    const planPremium = this.planes.find(p => p.tipo === 'premium');
    const monto = planPremium?.precio_mensual || 29.99;

    const request: CrearPagoRequest = {
      negocio_id: "1", // ID genérico para suscripciones
      usuario_id: this.usuarioId,
      monto: monto,
      moneda: 'USD',
      tipo: 'suscripcion',
      descripcion: 'Suscripción Premium - Virtual Queue CMS',
      metadatos: {
        tipo_suscripcion: 'premium',
        periodo: 'mensual'
      }
    };

    console.log('🔄 Creando pago para suscripción:', request);

    this.pagosService.crearPago(request).subscribe({
      next: (pago) => {
        console.log('✅ Pago creado exitosamente:', pago);
        console.log('🔍 URL Checkout:', pago.url_checkout);
        console.log('🔍 Estado:', pago.estado);
        console.log('🔍 Pasarela:', pago.pasarela);

        // Si hay URL de checkout (Stripe), redirigir
        if (pago.url_checkout) {
          console.log('🚀 Redirigiendo a checkout en 1 segundo...');
          console.log('URL completa:', pago.url_checkout);

          setTimeout(() => {
            console.log('🌐 Ejecutando redirección...');
            window.location.href = pago.url_checkout!;
          }, 1000);
        } else {
          console.log('⚠️ No hay url_checkout, creando suscripción directamente');
          // Si es mock o no hay URL, crear suscripción directamente
          this.crearSuscripcionDespuesDePago();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = err.error?.detail || 'Error al procesar el pago';
        console.error('❌ Error creando pago:', err);
        console.error('Detalles del error:', err.error);
      }
    });
  }

  crearSuscripcionDespuesDePago(): void {
    console.log('📝 Creando suscripción para usuario:', this.usuarioId);

    if (!this.usuarioId) {
      console.error('❌ No hay usuario ID');
      this.error = 'Error: Usuario no identificado';
      this.cargando = false;
      return;
    }

    const request: CrearSuscripcionRequest = {
      usuario_id: this.usuarioId!,
      tipo: 'premium',
      con_prueba_gratis: false
    };

    console.log('📤 Request de suscripción:', request);

    this.suscripcionService.crearSuscripcion(request).subscribe({
      next: (suscripcion: ISuscripcion) => {
        console.log('✅ Suscripción creada exitosamente:', suscripcion);
        this.suscripcion = suscripcion;
        this.verificacionPremium = {
          usuario_id: this.usuarioId!,
          es_premium: true,
          tipo_suscripcion: suscripcion.tipo,
          estado: suscripcion.estado,
          beneficios: suscripcion.beneficios,
          fecha_vencimiento: suscripcion.fecha_proximo_cobro,
          nivel_prioridad: 1
        };
        this.cargando = false;
        this.mostrarModalPago = false;
        this.mensajeExito = '¡Suscripción Premium activada con éxito!';
        console.log('🎉 Usuario ahora es Premium!');
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = err.error?.detail || 'Error al crear suscripción después del pago';
        console.error('❌ Error creando suscripción:', err);
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
