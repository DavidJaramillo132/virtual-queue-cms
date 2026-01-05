"""
Procesador de webhooks entrantes.
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, Callable, List

from app.modelos.partner import TipoEvento
from app.modelos.webhook import WebhookEventoInterno, WebhookRecibidoResponse
from app.webhooks.normalizador import NormalizadorWebhooks
from app.partners.servicio import ServicioPartners


class ProcesadorWebhooks:
    """
    Procesa webhooks entrantes y ejecuta handlers registrados.
    """
    
    _handlers: Dict[TipoEvento, List[Callable]] = {}
    _eventos_procesados: List[WebhookEventoInterno] = []
    
    @classmethod
    def registrar_handler(
        cls,
        evento: TipoEvento,
        handler: Callable
    ) -> None:
        """
        Registra un handler para un tipo de evento.
        
        Args:
            evento: Tipo de evento
            handler: Funcion async que procesa el evento
        """
        if evento not in cls._handlers:
            cls._handlers[evento] = []
        cls._handlers[evento].append(handler)
    
    @classmethod
    async def procesar_webhook_pasarela(
        cls,
        pasarela: str,
        payload: Dict[str, Any]
    ) -> WebhookRecibidoResponse:
        """
        Procesa un webhook de una pasarela de pago.
        
        Args:
            pasarela: Nombre de la pasarela
            payload: Payload del webhook
            
        Returns:
            WebhookRecibidoResponse
        """
        # Normalizar webhook
        evento = NormalizadorWebhooks.normalizar(pasarela, payload)
        
        # Procesar
        await cls._ejecutar_handlers(evento)
        
        # Notificar a partners suscritos
        await ServicioPartners.notificar_evento(
            evento=evento.tipo,
            datos=evento.datos,
            metadatos={"pasarela_origen": pasarela}
        )
        
        evento.procesado = True
        cls._eventos_procesados.append(evento)
        
        return WebhookRecibidoResponse(
            recibido=True,
            evento_id=evento.id,
            mensaje=f"Webhook de {pasarela} procesado correctamente",
            procesado=True
        )
    
    @classmethod
    async def procesar_webhook_externo(
        cls,
        origen: str,
        tipo_evento: str,
        datos: Dict[str, Any]
    ) -> WebhookRecibidoResponse:
        """
        Procesa un webhook de un partner externo.
        
        Args:
            origen: Sistema origen
            tipo_evento: Tipo de evento
            datos: Datos del evento
            
        Returns:
            WebhookRecibidoResponse
        """
        # Normalizar
        evento = NormalizadorWebhooks.normalizar_externo(origen, tipo_evento, datos)
        
        # Procesar
        await cls._ejecutar_handlers(evento)
        
        evento.procesado = True
        cls._eventos_procesados.append(evento)
        
        return WebhookRecibidoResponse(
            recibido=True,
            evento_id=evento.id,
            mensaje=f"Webhook externo de {origen} procesado",
            procesado=True
        )
    
    @classmethod
    async def _ejecutar_handlers(cls, evento: WebhookEventoInterno) -> None:
        """Ejecuta todos los handlers registrados para el evento."""
        handlers = cls._handlers.get(evento.tipo, [])
        
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(evento)
                else:
                    handler(evento)
            except Exception as e:
                print(f"Error en handler para {evento.tipo}: {e}")
    
    @classmethod
    def obtener_eventos_procesados(
        cls,
        limite: int = 100
    ) -> List[WebhookEventoInterno]:
        """Obtiene los ultimos eventos procesados."""
        return cls._eventos_procesados[-limite:]
    
    @classmethod
    def limpiar_handlers(cls) -> None:
        """Limpia todos los handlers (para testing)."""
        cls._handlers.clear()


# Handlers por defecto
async def handler_pago_exitoso(evento: WebhookEventoInterno) -> None:
    """Handler para pagos exitosos."""
    print(f"Pago exitoso recibido: {evento.datos}")
    # Aqui se podria actualizar el estado en la base de datos


async def handler_suscripcion_creada(evento: WebhookEventoInterno) -> None:
    """Handler para suscripciones creadas."""
    print(f"Suscripcion creada: {evento.datos}")
    # Aqui se activarian los beneficios premium


async def handler_booking_confirmed(evento: WebhookEventoInterno) -> None:
    """Handler para citas confirmadas (integracion B2B)."""
    print(f"Reserva confirmada recibida: {evento.datos}")
    # Procesar la reserva y responder si es necesario


# Registrar handlers por defecto
ProcesadorWebhooks.registrar_handler(TipoEvento.PAYMENT_SUCCESS, handler_pago_exitoso)
ProcesadorWebhooks.registrar_handler(TipoEvento.SUBSCRIPTION_CREATED, handler_suscripcion_creada)
ProcesadorWebhooks.registrar_handler(TipoEvento.BOOKING_CONFIRMED, handler_booking_confirmed)
