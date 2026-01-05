"""
Modelos relacionados con pagos.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class EstadoPago(str, Enum):
    """Estados posibles de un pago."""
    PENDIENTE = "pendiente"
    PROCESANDO = "procesando"
    COMPLETADO = "completado"
    FALLIDO = "fallido"
    REEMBOLSADO = "reembolsado"
    CANCELADO = "cancelado"


class TipoPago(str, Enum):
    """Tipos de pago soportados."""
    UNICO = "unico"
    SUSCRIPCION = "suscripcion"
    RECURRENTE = "recurrente"


class CrearPagoRequest(BaseModel):
    """Request para crear un nuevo pago."""
    negocio_id: str = Field(..., description="ID del negocio que recibe el pago")
    usuario_id: str = Field(..., description="ID del usuario que realiza el pago")
    monto: float = Field(..., gt=0, description="Monto del pago")
    moneda: str = Field(default="USD", description="Codigo de moneda ISO 4217")
    tipo: TipoPago = Field(default=TipoPago.UNICO, description="Tipo de pago")
    descripcion: Optional[str] = Field(None, description="Descripcion del pago")
    metadatos: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "negocio_id": "uuid-negocio",
                "usuario_id": "uuid-usuario",
                "monto": 29.99,
                "moneda": "USD",
                "tipo": "unico",
                "descripcion": "Suscripcion premium mensual"
            }
        }


class PagoResponse(BaseModel):
    """Response con informacion del pago."""
    id: str = Field(..., description="ID unico del pago")
    negocio_id: str
    usuario_id: str
    monto: float
    moneda: str
    estado: EstadoPago
    tipo: TipoPago
    pasarela: str = Field(..., description="Pasarela utilizada")
    id_transaccion_externa: Optional[str] = Field(None, description="ID en la pasarela")
    url_checkout: Optional[str] = Field(None, description="URL para completar el pago")
    descripcion: Optional[str] = None
    metadatos: Dict[str, Any] = Field(default_factory=dict)
    creado_en: datetime
    actualizado_en: datetime


class PagoNormalizado(BaseModel):
    """
    Estructura normalizada de pago.
    Convierte webhooks de diferentes pasarelas a un formato comun.
    """
    id_pago: str = Field(..., description="ID interno del pago")
    id_transaccion_externa: str = Field(..., description="ID de la pasarela")
    pasarela: str = Field(..., description="Nombre de la pasarela")
    estado: EstadoPago
    monto: float
    moneda: str
    negocio_id: Optional[str] = None
    usuario_id: Optional[str] = None
    metadatos: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    evento_original: str = Field(..., description="Tipo de evento original de la pasarela")


class ReembolsoRequest(BaseModel):
    """Request para solicitar un reembolso."""
    pago_id: str = Field(..., description="ID del pago a reembolsar")
    monto: Optional[float] = Field(None, description="Monto a reembolsar (parcial)")
    razon: Optional[str] = Field(None, description="Razon del reembolso")


class ReembolsoResponse(BaseModel):
    """Response de un reembolso."""
    id: str
    pago_id: str
    monto: float
    estado: EstadoPago
    razon: Optional[str]
    creado_en: datetime
