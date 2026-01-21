"""
Normalizador de webhooks de diferentes pasarelas.
"""
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field

from app.modelos.partner import TipoEvento
from app.modelos.webhook import WebhookEventoInterno
from app.adaptador import obtener_adaptador


class TipoEventoPago(Enum):
    """Tipos de eventos de pago normalizados."""
    PAGO_APROBADO = "pago_aprobado"
    PAGO_RECHAZADO = "pago_rechazado"
    PAGO_PENDIENTE = "pago_pendiente"
    PAGO_REEMBOLSADO = "pago_reembolsado"
    SUSCRIPCION_CREADA = "suscripcion_creada"
    SUSCRIPCION_CANCELADA = "suscripcion_cancelada"


@dataclass
class EventoNormalizado:
    """Evento de pago normalizado de cualquier pasarela."""
    payment_id: str
    event_type: TipoEventoPago
    pasarela: str
    monto: int = 0  # En centavos
    moneda: str = "USD"
    usuario_id: Optional[str] = None
    negocio_id: Optional[str] = None
    cita_id: Optional[str] = None
    metadatos: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte a diccionario para serializar."""
        return {
            "payment_id": self.payment_id,
            "event_type": self.event_type.value,
            "pasarela": self.pasarela,
            "monto": self.monto,
            "moneda": self.moneda,
            "usuario_id": self.usuario_id,
            "negocio_id": self.negocio_id,
            "cita_id": self.cita_id,
            "metadatos": self.metadatos,
            "timestamp": self.timestamp.isoformat()
        }


class NormalizadorWebhooks:
    """
    Normaliza webhooks de diferentes pasarelas a un formato interno comun.
    """
    
    # Mapeo de eventos de pasarela a TipoEventoPago
    MAPEO_EVENTOS = {
        "payment_intent.succeeded": TipoEventoPago.PAGO_APROBADO,
        "payment_intent.payment_failed": TipoEventoPago.PAGO_RECHAZADO,
        "charge.refunded": TipoEventoPago.PAGO_REEMBOLSADO,
        "customer.subscription.created": TipoEventoPago.SUSCRIPCION_CREADA,
        "customer.subscription.deleted": TipoEventoPago.SUSCRIPCION_CANCELADA,
        # MercadoPago
        "payment.approved": TipoEventoPago.PAGO_APROBADO,
        "payment.rejected": TipoEventoPago.PAGO_RECHAZADO,
        "payment.refunded": TipoEventoPago.PAGO_REEMBOLSADO,
        # Mock/default
        "pago_exitoso": TipoEventoPago.PAGO_APROBADO,
        "pago_fallido": TipoEventoPago.PAGO_RECHAZADO,
    }
    
    @staticmethod
    def normalizar(
        pasarela: str,
        payload: Dict[str, Any]
    ) -> EventoNormalizado:
        """
        Normaliza un webhook de cualquier pasarela.
        
        Args:
            pasarela: Nombre de la pasarela (stripe, mercadopago, mock)
            payload: Payload original del webhook
            
        Returns:
            EventoNormalizado con formato normalizado
        """
        adaptador = obtener_adaptador(pasarela)
        datos_normalizados = adaptador.normalizar_webhook(payload)
        
        # Determinar tipo de evento
        evento_original = datos_normalizados.get("evento_original", "unknown")
        tipo_evento = NormalizadorWebhooks.MAPEO_EVENTOS.get(
            evento_original, 
            TipoEventoPago.PAGO_PENDIENTE
        )
        
        # Extraer datos del payload normalizado
        datos = datos_normalizados.get("datos", {})
        
        return EventoNormalizado(
            payment_id=datos_normalizados.get("id", ""),
            event_type=tipo_evento,
            pasarela=pasarela,
            monto=datos.get("monto", 0),
            moneda=datos.get("moneda", "USD"),
            usuario_id=datos.get("usuario_id"),
            negocio_id=datos.get("negocio_id"),
            cita_id=datos.get("cita_id"),
            metadatos=datos,
            timestamp=datetime.fromisoformat(
                datos_normalizados.get("timestamp", datetime.utcnow().isoformat())
            )
        )
    
    @staticmethod
    def normalizar_interno(
        pasarela: str,
        payload: Dict[str, Any]
    ) -> WebhookEventoInterno:
        """
        Normaliza un webhook a formato WebhookEventoInterno (para compatibilidad).
        
        Args:
            pasarela: Nombre de la pasarela
            payload: Payload original
            
        Returns:
            WebhookEventoInterno
        """
        adaptador = obtener_adaptador(pasarela)
        datos_normalizados = adaptador.normalizar_webhook(payload)
        
        return WebhookEventoInterno(
            id=datos_normalizados.get("id", ""),
            tipo=TipoEvento(datos_normalizados.get("tipo", TipoEvento.EXTERNAL_SERVICE.value)),
            pasarela=pasarela,
            evento_original=datos_normalizados.get("evento_original", "unknown"),
            datos=datos_normalizados.get("datos", {}),
            timestamp=datetime.fromisoformat(
                datos_normalizados.get("timestamp", datetime.utcnow().isoformat())
            )
        )
    
    @staticmethod
    def normalizar_externo(
        origen: str,
        tipo_evento: str,
        datos: Dict[str, Any]
    ) -> WebhookEventoInterno:
        """
        Normaliza un webhook de un partner externo.
        
        Args:
            origen: Sistema origen del webhook
            tipo_evento: Tipo de evento
            datos: Datos del evento
            
        Returns:
            WebhookEventoInterno normalizado
        """
        # Intentar mapear a un TipoEvento conocido
        try:
            tipo = TipoEvento(tipo_evento)
        except ValueError:
            tipo = TipoEvento.EXTERNAL_SERVICE
        
        return WebhookEventoInterno(
            id=datos.get("evento_id", datos.get("id", "")),
            tipo=tipo,
            pasarela="externo",
            evento_original=tipo_evento,
            datos=datos,
            timestamp=datetime.utcnow()
        )
