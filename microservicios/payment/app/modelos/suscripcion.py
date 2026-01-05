"""
Modelos relacionados con suscripciones premium.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class EstadoSuscripcion(str, Enum):
    """Estados posibles de una suscripcion."""
    PRUEBA = "prueba"
    ACTIVA = "activa"
    PAUSADA = "pausada"
    CANCELADA = "cancelada"
    VENCIDA = "vencida"


class TipoSuscripcion(str, Enum):
    """Tipos de suscripcion disponibles."""
    BASICO = "basico"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class BeneficiosPremium(BaseModel):
    """Beneficios incluidos en la suscripcion premium para usuarios."""
    prioridad_cola: bool = Field(True, description="Prioridad exclusiva en colas de atencion")
    fila_vip: bool = Field(True, description="Acceso a fila VIP exclusiva")
    reservas_prioritarias: bool = Field(True, description="Reservar citas antes que usuarios normales")
    cancelacion_flexible: bool = Field(True, description="Cancelacion sin penalizacion")
    soporte_prioritario: bool = Field(True, description="Soporte al cliente prioritario")
    notificaciones_avanzadas: bool = Field(True, description="Notificaciones personalizadas")
    sin_publicidad: bool = Field(True, description="Sin anuncios")
    limite_citas_diarias: int = Field(100, description="Limite de citas por dia")


class CrearSuscripcionRequest(BaseModel):
    """Request para crear una suscripcion de usuario."""
    usuario_id: str = Field(..., description="ID del usuario")
    tipo: TipoSuscripcion = Field(default=TipoSuscripcion.PREMIUM)
    con_prueba_gratis: bool = Field(True, description="Iniciar con periodo de prueba")
    metodo_pago_id: Optional[str] = Field(None, description="ID del metodo de pago")
    
    class Config:
        json_schema_extra = {
            "example": {
                "usuario_id": "uuid-usuario",
                "tipo": "premium",
                "con_prueba_gratis": True
            }
        }


class SuscripcionResponse(BaseModel):
    """Response con informacion de la suscripcion de usuario."""
    id: str
    usuario_id: str
    tipo: TipoSuscripcion
    estado: EstadoSuscripcion
    precio_mensual: float
    moneda: str = "USD"
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    fecha_proximo_cobro: Optional[datetime] = None
    dias_prueba_restantes: int = 0
    beneficios: BeneficiosPremium
    id_suscripcion_externa: Optional[str] = None
    historial_pagos: List[str] = Field(default_factory=list)
    creado_en: datetime
    actualizado_en: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "sub_123",
                "usuario_id": "uuid-usuario",
                "tipo": "premium",
                "estado": "activa",
                "precio_mensual": 29.99,
                "moneda": "USD",
                "fecha_inicio": "2026-01-01T00:00:00Z",
                "fecha_proximo_cobro": "2026-02-01T00:00:00Z",
                "dias_prueba_restantes": 0,
                "beneficios": {
                    "prioridad_cola": True,
                    "fila_vip": True
                }
            }
        }


class CancelarSuscripcionRequest(BaseModel):
    """Request para cancelar una suscripcion."""
    suscripcion_id: str
    razon: Optional[str] = None
    cancelar_inmediatamente: bool = Field(
        False, 
        description="Si es False, cancela al final del periodo"
    )


class VerificarPremiumResponse(BaseModel):
    """Response para verificar si un usuario es premium."""
    usuario_id: str
    es_premium: bool
    tipo_suscripcion: Optional[TipoSuscripcion] = None
    estado: Optional[EstadoSuscripcion] = None
    beneficios: Optional[BeneficiosPremium] = None
    fecha_vencimiento: Optional[datetime] = None
    nivel_prioridad: int = Field(5, description="Nivel de prioridad en cola (1=VIP, 5=Normal)")
