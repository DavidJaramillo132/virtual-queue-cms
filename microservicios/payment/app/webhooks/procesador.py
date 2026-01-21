"""
Procesador de webhooks entrantes.
Integra con n8n Event Bus para orquestacion centralizada.
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, Callable, List

from app.modelos.partner import TipoEvento
from app.modelos.webhook import WebhookEventoInterno, WebhookRecibidoResponse
from app.webhooks.normalizador import NormalizadorWebhooks, EventoNormalizado, TipoEventoPago
from app.partners.servicio import ServicioPartners
from app.servicios.n8n_event_bus import get_n8n_client
from app.seguridad.hmac_auth import generar_firma_hmac
from app.partners.almacen import AlmacenPartners


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
        Normaliza y envia a n8n Event Bus para orquestacion.
        
        Args:
            pasarela: Nombre de la pasarela (stripe, mercadopago, mock)
            payload: Payload del webhook
            
        Returns:
            WebhookRecibidoResponse
        """
        # 1. Normalizar webhook a formato común
        evento_normalizado: EventoNormalizado = NormalizadorWebhooks.normalizar(
            pasarela, 
            payload
        )
        
        print(f"📥 Webhook recibido de {pasarela}: {evento_normalizado.event_type.value}")
        
        # 2. Obtener información de partner si existe
        partner_webhook_url = None
        partner_signature = None
        
        if evento_normalizado.negocio_id:
            # Buscar si este negocio tiene un partner asociado
            partner = AlmacenPartners.obtener_por_metadatos(
                "negocio_id", 
                evento_normalizado.negocio_id
            )
            if partner and partner.activo:
                partner_webhook_url = partner.webhook_url
                # Generar firma HMAC para el partner
                payload_bytes = str(evento_normalizado.to_dict()).encode()
                firma, timestamp = generar_firma_hmac(
                    payload_bytes,
                    partner.hmac_secret
                )
                partner_signature = f"{timestamp}.{firma}"
        
        # 3. Enviar a n8n Event Bus (orquestador central)
        n8n_client = get_n8n_client()
        success = await n8n_client.enviar_evento_con_fallback(
            evento=evento_normalizado,
            fallback_callback=cls._fallback_n8n_no_disponible
        )
        
        if not success:
            print(f"⚠️ n8n Event Bus no disponible, ejecutando fallback local")
        
        # 4. Ejecutar handlers locales (opcional, para procesamiento inmediato)
        # await cls._ejecutar_handlers_locales(evento_normalizado)
        
        return WebhookRecibidoResponse(
            recibido=True,
            evento_id=evento_normalizado.payment_id,
            mensaje=f"Webhook de {pasarela} procesado y enviado a Event Bus",
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
        print(f"📥 Webhook externo recibido de {origen}: {tipo_evento}")
        
        # Normalizar
        evento = NormalizadorWebhooks.normalizar_externo(origen, tipo_evento, datos)
        
        # Ejecutar handlers locales
        await cls._ejecutar_handlers(evento)
        
        evento.procesado = True
        cls._eventos_procesados.append(evento)
        
        return WebhookRecibidoResponse(
            recibido=True,
            evento_id=evento.id,
            mensaje=f"Webhook externo de {origen} procesado correctamente",
            procesado=True
        )
    
    @classmethod
    async def _fallback_n8n_no_disponible(cls, evento: EventoNormalizado) -> None:
        """
        Fallback cuando n8n Event Bus no está disponible.
        Ejecuta acciones críticas directamente.
        """
        print(f"🔄 Ejecutando fallback local para {evento.event_type.value}")
        
        # Solo ejecutar acciones críticas
        if evento.event_type == TipoEventoPago.PAGO_APROBADO:
            # Aquí deberías actualizar el estado de la cita directamente
            # Por ejemplo: await actualizar_estado_cita(evento.cita_id, "confirmed")
            print(f"💳 Pago aprobado (fallback): {evento.payment_id}")
            
            # Notificar a partners críticos directamente (bypass n8n)
            if evento.negocio_id:
                await ServicioPartners.notificar_evento(
                    evento=TipoEvento.PAYMENT_SUCCESS,
                    datos=evento.to_dict()
                )
    
    @classmethod
    async def _ejecutar_handlers_locales(cls, evento: EventoNormalizado) -> None:
        """
        Ejecuta handlers locales para procesamiento inmediato.
        Opcional: usar solo si se necesita procesamiento síncrono.
        """
        # Mapeo de TipoEventoPago a TipoEvento
        mapeo_eventos = {
            TipoEventoPago.PAGO_APROBADO: TipoEvento.PAYMENT_SUCCESS,
            TipoEventoPago.PAGO_RECHAZADO: TipoEvento.PAYMENT_FAILED,
            TipoEventoPago.PAGO_REEMBOLSADO: TipoEvento.PAYMENT_REFUNDED,
        }
        
        tipo_evento = mapeo_eventos.get(evento.event_type)
        if not tipo_evento:
            return
        
        handlers = cls._handlers.get(tipo_evento, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(evento)
                else:
                    handler(evento)
            except Exception as e:
                print(f"❌ Error en handler local: {e}")
    
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
