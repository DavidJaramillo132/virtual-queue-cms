"""
Modelos relacionados con webhooks.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from app.modelos.partner import TipoEvento
from app.modelos.pago import EstadoPago


class WebhookEventoInterno(BaseModel):
    """
    Estructura interna normalizada de eventos webhook.
    Todos los eventos de pasarelas se convierten a este formato.
    """
    id: str = Field(..., description="ID unico del evento")
    tipo: TipoEvento = Field(..., description="Tipo de evento normalizado")
    pasarela: str = Field(..., description="Pasarela origen")
    evento_original: str = Field(..., description="Tipo de evento original")
    datos: Dict[str, Any] = Field(..., description="Datos del evento")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    procesado: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "evt_123",
                "tipo": "payment.success",
                "pasarela": "stripe",
                "evento_original": "payment_intent.succeeded",
                "datos": {
                    "pago_id": "pay_123",
                    "monto": 29.99,
                    "moneda": "USD"
                },
                "timestamp": "2026-01-01T12:00:00Z"
            }
        }


class WebhookStripe(BaseModel):
    """Estructura de webhook de Stripe."""
    id: str
    object: str = "event"
    type: str
    data: Dict[str, Any]
    created: int
    livemode: bool = False
    api_version: Optional[str] = None
    request: Optional[Dict[str, Any]] = None


class WebhookMercadoPago(BaseModel):
    """Estructura de webhook de MercadoPago."""
    id: Optional[str] = None
    action: str
    api_version: Optional[str] = None
    data: Dict[str, Any]
    date_created: Optional[str] = None
    live_mode: bool = False
    type: str
    user_id: Optional[str] = None


class NotificacionPartner(BaseModel):
    """
    Notificacion que se envia a los partners.
    Incluye toda la informacion necesaria para procesar el evento.
    """
    evento_id: str = Field(..., description="ID unico del evento")
    tipo_evento: TipoEvento = Field(..., description="Tipo de evento")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    origen: str = Field(default="virtual-queue-cms", description="Sistema origen")
    version: str = Field(default="1.0", description="Version del payload")
    datos: Dict[str, Any] = Field(..., description="Datos del evento")
    metadatos: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "evento_id": "evt_vq_123",
                "tipo_evento": "booking.confirmed",
                "timestamp": "2026-01-01T12:00:00Z",
                "origen": "virtual-queue-cms",
                "version": "1.0",
                "datos": {
                    "cita_id": "cita_123",
                    "negocio_id": "neg_456",
                    "usuario_id": "usr_789",
                    "fecha": "2026-01-15",
                    "hora_inicio": "10:00",
                    "hora_fin": "11:00",
                    "servicio": "Corte de cabello"
                },
                "metadatos": {
                    "ip_origen": "192.168.1.1"
                }
            }
        }


class RecibirWebhookExternoRequest(BaseModel):
    """Request para recibir webhooks de partners externos."""
    evento_id: str
    tipo_evento: str
    timestamp: Optional[datetime] = None
    origen: str
    version: Optional[str] = "1.0"
    datos: Dict[str, Any]
    metadatos: Optional[Dict[str, Any]] = Field(default_factory=dict)


class WebhookRecibidoResponse(BaseModel):
    """Response al recibir un webhook."""
    recibido: bool = True
    evento_id: str
    mensaje: str = "Webhook recibido correctamente"
    procesado: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)
