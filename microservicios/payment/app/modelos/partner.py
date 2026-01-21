"""
Modelos relacionados con partners B2B.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, HttpUrl


class TipoEvento(str, Enum):
    """Tipos de eventos disponibles para suscripcion."""
    # Eventos de reservas/citas
    BOOKING_CONFIRMED = "booking.confirmed"
    BOOKING_CANCELLED = "booking.cancelled"
    BOOKING_UPDATED = "booking.updated"
    BOOKING_COMPLETED = "booking.completed"
    
    # Eventos de pagos
    PAYMENT_SUCCESS = "payment.success"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_REFUNDED = "payment.refunded"
    
    # Eventos de suscripciones
    SUBSCRIPTION_CREATED = "subscription.created"
    SUBSCRIPTION_ACTIVATED = "subscription.activated"
    SUBSCRIPTION_CANCELLED = "subscription.cancelled"
    SUBSCRIPTION_RENEWED = "subscription.renewed"
    
    # Eventos de servicios
    SERVICE_ACTIVATED = "service.activated"
    SERVICE_DEACTIVATED = "service.deactivated"
    
    # Eventos de negocios
    BUSINESS_CREATED = "business.created"
    BUSINESS_UPDATED = "business.updated"
    
    # Eventos B2B personalizados
    ORDER_CREATED = "order.created"
    TOUR_PURCHASED = "tour.purchased"
    EXTERNAL_SERVICE = "external.service"
    
    # Eventos de adopción (integración con partners)
    ANIMAL_ADOPTED = "animal.adopted"
    ADOPTION_COMPLETED = "adoption.completed"
    
    # Eventos de descuentos (notificaciones salientes)
    DISCOUNT_APPLIED = "discount.applied"
    PROMOTION_ACTIVATED = "promotion.activated"


class RegistrarPartnerRequest(BaseModel):
    """Request para registrar un nuevo partner."""
    nombre: str = Field(..., min_length=3, max_length=100, description="Nombre del partner")
    webhook_url: str = Field(..., description="URL del webhook del partner")
    eventos_suscritos: List[TipoEvento] = Field(
        ..., 
        min_length=1,
        description="Lista de eventos a los que se suscribe"
    )
    descripcion: Optional[str] = Field(None, description="Descripcion del partner")
    contacto_email: Optional[str] = Field(None, description="Email de contacto")
    metadatos: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Tours Ecuador",
                "webhook_url": "https://api.toursecuador.com/webhooks/virtual-queue",
                "eventos_suscritos": ["booking.confirmed", "payment.success"],
                "descripcion": "Integracion con sistema de tours",
                "contacto_email": "tech@toursecuador.com"
            }
        }


class PartnerResponse(BaseModel):
    """Response con informacion del partner."""
    id: str
    nombre: str
    webhook_url: str
    eventos_suscritos: List[TipoEvento]
    hmac_secret: str = Field(..., description="Secreto HMAC para firmar webhooks")
    activo: bool = True
    descripcion: Optional[str] = None
    contacto_email: Optional[str] = None
    metadatos: Dict[str, Any] = Field(default_factory=dict)
    ultimo_webhook_enviado: Optional[datetime] = None
    webhooks_exitosos: int = 0
    webhooks_fallidos: int = 0
    creado_en: datetime
    actualizado_en: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "7351757e-7f56-4133-af42-b8e8522b6316",
                "nombre": "Tours Ecuador",
                "webhook_url": "https://api.toursecuador.com/webhooks",
                "eventos_suscritos": ["booking.confirmed"],
                "hmac_secret": "whsec_abc123...",
                "activo": True,
                "creado_en": "2026-01-01T00:00:00Z"
            }
        }


class ActualizarPartnerRequest(BaseModel):
    """Request para actualizar un partner existente."""
    nombre: Optional[str] = None
    webhook_url: Optional[str] = None
    eventos_suscritos: Optional[List[TipoEvento]] = None
    activo: Optional[bool] = None
    descripcion: Optional[str] = None
    contacto_email: Optional[str] = None
    regenerar_secret: bool = Field(False, description="Regenerar el HMAC secret")


class PartnerWebhookLog(BaseModel):
    """Log de un webhook enviado a un partner."""
    id: str
    partner_id: str
    evento: TipoEvento
    payload: Dict[str, Any]
    estado_respuesta: int
    tiempo_respuesta_ms: int
    exitoso: bool
    error: Optional[str] = None
    reintentos: int = 0
    enviado_en: datetime
