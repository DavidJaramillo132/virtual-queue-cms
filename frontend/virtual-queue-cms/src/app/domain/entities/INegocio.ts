export interface INegocio {
  id: string;
  admin_negocio_id?: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  imagen_url?: string;
  estado: boolean;
  horario_general?: string;
  creadoEn?: Date;
}

export interface ISuscripcion {
  id: string;
  usuario_id: string;
  tipo: 'basico' | 'premium' | 'enterprise';
  estado: 'prueba' | 'activa' | 'pausada' | 'cancelada' | 'vencida';
  precio_mensual: number;
  moneda: string;
  fecha_inicio: Date;
  fecha_fin?: Date;
  fecha_proximo_cobro?: Date;
  dias_prueba_restantes: number;
  beneficios: IBeneficiosPremium;
  creado_en: Date;
  actualizado_en: Date;
}

export interface IBeneficiosPremium {
  prioridad_cola: boolean;
  fila_vip: boolean;
  reservas_prioritarias: boolean;
  cancelacion_flexible: boolean;
  soporte_prioritario: boolean;
  notificaciones_avanzadas: boolean;
  sin_publicidad: boolean;
  limite_citas_diarias: number;
}

export interface IVerificarPremium {
  usuario_id: string;
  es_premium: boolean;
  tipo_suscripcion?: string;
  estado?: string;
  beneficios?: IBeneficiosPremium;
  fecha_vencimiento?: Date;
  nivel_prioridad?: number; // 1=VIP, 5=Normal
}

export interface IPlanSuscripcion {
  tipo: string;
  nombre: string;
  precio_mensual: number;
  moneda: string;
  dias_prueba: number;
  beneficios: IBeneficiosPremium;
}



