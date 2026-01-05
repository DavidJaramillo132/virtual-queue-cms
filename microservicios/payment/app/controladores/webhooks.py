"""
Controlador de webhooks.
"""
from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional, Dict, Any

from app.modelos.webhook import (
    WebhookRecibidoResponse,
    RecibirWebhookExternoRequest
)
from app.modelos.partner import TipoEvento
from app.webhooks.procesador import ProcesadorWebhooks
from app.adaptador import obtener_adaptador
from app.seguridad.hmac_auth import verificar_firma_hmac
from app.config import configuracion
from app.partners.almacen import AlmacenPartners

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/stripe", response_model=WebhookRecibidoResponse)
async def webhook_stripe(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature")
):
    """
    Recibe webhooks de Stripe.
    
    Verifica la firma del webhook y procesa el evento.
    """
    body = await request.body()
    
    # Verificar firma si esta configurado
    if configuracion.STRIPE_WEBHOOK_SECRET and stripe_signature:
        adaptador = obtener_adaptador("stripe")
        if not adaptador.verificar_firma_webhook(
            body,
            stripe_signature,
            configuracion.STRIPE_WEBHOOK_SECRET
        ):
            raise HTTPException(status_code=401, detail="Firma invalida")
    
    # Procesar
    import json
    payload = json.loads(body)
    
    return await ProcesadorWebhooks.procesar_webhook_pasarela("stripe", payload)


@router.post("/mercadopago", response_model=WebhookRecibidoResponse)
async def webhook_mercadopago(
    request: Request,
    x_signature: Optional[str] = Header(None, alias="X-Signature")
):
    """
    Recibe webhooks de MercadoPago.
    """
    body = await request.body()
    
    # Verificar firma si esta configurado
    if configuracion.MERCADOPAGO_WEBHOOK_SECRET and x_signature:
        adaptador = obtener_adaptador("mercadopago")
        if not adaptador.verificar_firma_webhook(
            body,
            x_signature,
            configuracion.MERCADOPAGO_WEBHOOK_SECRET
        ):
            raise HTTPException(status_code=401, detail="Firma invalida")
    
    import json
    payload = json.loads(body)
    
    return await ProcesadorWebhooks.procesar_webhook_pasarela("mercadopago", payload)


@router.post("/mock", response_model=WebhookRecibidoResponse)
async def webhook_mock(payload: Dict[str, Any]):
    """
    Recibe webhooks del adaptador mock (para testing).
    """
    return await ProcesadorWebhooks.procesar_webhook_pasarela("mock", payload)


@router.post("/external", response_model=WebhookRecibidoResponse)
async def webhook_externo(
    request: Request,
    x_webhook_signature: str = Header(..., alias="X-Webhook-Signature"),
    x_webhook_timestamp: str = Header(..., alias="X-Webhook-Timestamp"),
    x_partner_id: Optional[str] = Header(None, alias="X-Partner-ID")
):
    """
    Recibe webhooks de partners externos.
    
    Este es el endpoint principal para integracion B2B.
    Todos los webhooks deben estar firmados con HMAC-SHA256.
    
    Headers requeridos:
    - X-Webhook-Signature: Firma HMAC del payload
    - X-Webhook-Timestamp: Timestamp Unix del envio
    - X-Partner-ID: (opcional) ID del partner que envia
    """
    body = await request.body()
    
    try:
        timestamp = int(x_webhook_timestamp)
    except ValueError:
        raise HTTPException(status_code=400, detail="Timestamp invalido")
    
    # Obtener secreto del partner o usar el global
    secreto = configuracion.HMAC_SECRET_GLOBAL
    if x_partner_id:
        partner = AlmacenPartners.obtener(x_partner_id)
        if partner:
            secreto = partner.hmac_secret
    
    # Verificar firma
    if not verificar_firma_hmac(body, x_webhook_signature, secreto, timestamp):
        raise HTTPException(status_code=401, detail="Firma HMAC invalida")
    
    # Parsear y procesar
    import json
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="JSON invalido")
    
    return await ProcesadorWebhooks.procesar_webhook_externo(
        origen=payload.get("origen", "desconocido"),
        tipo_evento=payload.get("tipo_evento", "external.service"),
        datos=payload.get("datos", payload)
    )


@router.post("/test")
async def webhook_test(payload: Dict[str, Any]):
    """
    Endpoint de prueba para webhooks.
    No requiere autenticacion, solo para desarrollo.
    """
    return {
        "recibido": True,
        "payload": payload,
        "mensaje": "Webhook de prueba recibido correctamente"
    }


@router.get("/eventos")
async def listar_eventos_procesados(limite: int = 50):
    """
    Lista los ultimos eventos procesados.
    """
    eventos = ProcesadorWebhooks.obtener_eventos_procesados(limite)
    return {
        "total": len(eventos),
        "eventos": [
            {
                "id": e.id,
                "tipo": e.tipo.value,
                "pasarela": e.pasarela,
                "procesado": e.procesado,
                "timestamp": e.timestamp.isoformat()
            }
            for e in eventos
        ]
    }
