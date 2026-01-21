"""
Controlador de webhooks.
"""
from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional, Dict, Any
import json

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
from app.servicios.descuentos import ServicioDescuentos

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


@router.post("/partners/{partner_id}", response_model=WebhookRecibidoResponse)
async def webhook_partner_especifico(
    partner_id: str,
    request: Request,
    x_webhook_signature: str = Header(..., alias="X-Webhook-Signature"),
    x_webhook_timestamp: Optional[str] = Header(None, alias="X-Webhook-Timestamp")
):
    """
    Recibe webhooks de un partner específico por su ID.
    
    Soporta DOS formatos:
    
    1. Formato Simple:
       Headers:
         - X-Webhook-Signature: <firma_hmac>
         - X-Webhook-Timestamp: <timestamp_unix>
       Payload: {"origen": "...", "tipo_evento": "...", "datos": {...}}
    
    2. Formato Stripe:
       Headers:
         - X-Webhook-Signature: t=<timestamp>,v1=<firma_hmac>
       Payload: {"event_type": "...", "data": {...}}
    """
    body = await request.body()
    
    # Detectar formato de firma (Stripe vs Simple)
    if x_webhook_signature.startswith("t="):
        # Formato Stripe: t=timestamp,v1=firma
        try:
            parts = dict(p.split("=", 1) for p in x_webhook_signature.split(","))
            timestamp = int(parts.get("t", 0))
            firma = parts.get("v1", "")
        except (ValueError, KeyError):
            raise HTTPException(status_code=400, detail="Formato de firma Stripe inválido. Esperado: t=timestamp,v1=firma")
    else:
        # Formato Simple: firma directa + header de timestamp
        if not x_webhook_timestamp:
            raise HTTPException(status_code=400, detail="X-Webhook-Timestamp requerido para formato simple")
        try:
            timestamp = int(x_webhook_timestamp)
        except ValueError:
            raise HTTPException(status_code=400, detail="Timestamp invalido")
        firma = x_webhook_signature
    
    # Buscar el partner por ID
    partner = AlmacenPartners.obtener(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail=f"Partner '{partner_id}' no encontrado")
    
    if not partner.activo:
        raise HTTPException(status_code=403, detail=f"Partner '{partner_id}' no está activo")
    
    # Verificar firma con el secreto del partner
    if not verificar_firma_hmac(body, firma, partner.hmac_secret, timestamp):
        raise HTTPException(status_code=401, detail="Firma HMAC invalida")
    
    # Parsear payload
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="JSON invalido")
    
    # Normalizar campos (soportar ambos formatos)
    origen = payload.get("origen") or payload.get("source") or partner_id
    tipo_evento = payload.get("tipo_evento") or payload.get("event_type") or "external.service"
    datos = payload.get("datos") or payload.get("data") or payload
    
    print(f"📥 Webhook recibido de partner: {partner_id}")
    print(f"   Evento: {tipo_evento}")
    print(f"   Formato: {'Stripe' if x_webhook_signature.startswith('t=') else 'Simple'}")
    
    return await ProcesadorWebhooks.procesar_webhook_externo(
        origen=origen,
        tipo_evento=tipo_evento,
        datos=datos
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


@router.post("/love4pets")
async def webhook_love4pets(payload: Dict[str, Any]):
    """
    Endpoint para recibir webhooks de Love4Pets.
    
    NO requiere autenticación (solo para desarrollo).
    Procesa eventos de adopción y aplica descuentos automáticamente.
    
    Eventos soportados:
    - adoption.completed: Aplica 20% de descuento
    - adoption.created: Registra la adopción
    """
    print(f"\n📥 Webhook recibido de Love4Pets")
    print(f"   Payload: {payload}")
    
    # Extraer datos del webhook
    event_type = payload.get("event") or payload.get("event_type") or "unknown"
    adopter_email = payload.get("adopter_email") or payload.get("data", {}).get("adopter_email")
    adopter_name = payload.get("adopter_name") or payload.get("data", {}).get("adopter_name")
    
    print(f"   Evento: {event_type}")
    print(f"   Email: {adopter_email}")
    
    # Procesar según tipo de evento
    if event_type in ["adoption.completed", "adoption.created"]:
        if adopter_email:
            # Aplicar descuento
            resultado = await ServicioDescuentos.aplicar_descuento_adopcion(
                usuario_email=adopter_email,
                partner_id="love4pets",
                metadata={
                    "adopter_name": adopter_name,
                    "animal_name": payload.get("animal_name"),
                    "event_type": event_type
                }
            )
            
            if resultado and resultado.get("status") == "success":
                print(f"🎉 Descuento aplicado: {resultado.get('porcentaje')}%")
                return {
                    "recibido": True,
                    "procesado": True,
                    "descuento_aplicado": True,
                    "descuento_id": resultado.get("descuento_id"),
                    "porcentaje": resultado.get("porcentaje"),
                    "mensaje": f"Descuento del {resultado.get('porcentaje')}% aplicado al usuario {adopter_email}"
                }
            else:
                print(f"⚠️ No se pudo aplicar descuento: {resultado}")
                return {
                    "recibido": True,
                    "procesado": True,
                    "descuento_aplicado": False,
                    "razon": resultado.get("message") if resultado else "Usuario no encontrado",
                    "mensaje": "Usuario no tiene suscripción activa o ya tiene descuento"
                }
        else:
            return {
                "recibido": True,
                "procesado": False,
                "error": "adopter_email es requerido"
            }
    
    return {
        "recibido": True,
        "procesado": False,
        "mensaje": f"Evento {event_type} recibido pero no procesado"
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


# ========== FUNCIONES AUXILIARES PARA PARTNERS ==========

async def procesar_evento_partner(
    partner_id: str,
    event_type: TipoEvento,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Procesa un evento recibido de un partner.
    """
    print(f"\n🔄 Procesando evento: {event_type.value}")
    
    # Handler para adopciones de animales
    if event_type == TipoEvento.ANIMAL_ADOPTED:
        return await manejar_adopcion_animal(partner_id, data)
    
    # Handler para completar adopción
    elif event_type == TipoEvento.ADOPTION_COMPLETED:
        return await manejar_adopcion_completada(partner_id, data)
    
    # Handler genérico para otros eventos
    else:
        print(f"ℹ️ Evento {event_type.value} recibido pero sin handler específico")
        return {
            "processed": True,
            "handler": "generic",
            "message": f"Evento {event_type.value} registrado"
        }


async def manejar_adopcion_animal(
    partner_id: str,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Maneja el evento de adopción de animal.
    
    Datos esperados:
    - usuario_email: Email del usuario que adoptó
    - animal_id: ID del animal adoptado
    - animal_tipo: Tipo de animal (perro, gato, etc)
    - fecha_adopcion: Fecha de la adopción
    """
    usuario_email = data.get("usuario_email") or data.get("email")
    
    if not usuario_email:
        return {
            "error": "usuario_email requerido",
            "status": "failed"
        }
    
    print(f"🐾 Procesando adopción para usuario: {usuario_email}")
    
    # Aplicar descuento automático
    resultado = await ServicioDescuentos.aplicar_descuento_adopcion(
        usuario_email=usuario_email,
        partner_id=partner_id,
        metadata={
            "animal_id": data.get("animal_id"),
            "animal_tipo": data.get("animal_tipo"),
            "animal_nombre": data.get("animal_nombre"),
            "fecha_adopcion": data.get("fecha_adopcion"),
            "refugio": data.get("refugio")
        }
    )
    
    if resultado and resultado.get("status") == "success":
        print(f"🎉 Descuento aplicado exitosamente!")
        return {
            "processed": True,
            "descuento_aplicado": True,
            "descuento_id": resultado.get("descuento_id"),
            "porcentaje_descuento": resultado.get("porcentaje"),
            "mensaje": f"¡Felicidades por la adopción! Se aplicó un descuento del {resultado.get('porcentaje')}% en tu suscripción premium."
        }
    else:
        return {
            "processed": True,
            "descuento_aplicado": False,
            "razon": resultado.get("message") if resultado else "Error al aplicar descuento"
        }


async def manejar_adopcion_completada(
    partner_id: str,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Maneja el evento de adopción completada.
    Puede usarse para confirmaciones adicionales o bonificaciones.
    """
    usuario_email = data.get("usuario_email") or data.get("email")
    
    print(f"✅ Adopción completada para: {usuario_email}")
    
    # Aquí podrías agregar lógica adicional, como:
    # - Enviar email de bienvenida
    # - Activar beneficios adicionales
    # - Registrar en sistema de CRM
    
    return {
        "processed": True,
        "mensaje": "Adopción registrada exitosamente"
    }


@router.get("/test/eventos-disponibles")
async def listar_eventos_disponibles():
    """
    Lista todos los eventos disponibles para webhooks.
    """
    return {
        "eventos_entrantes": [
            {
                "tipo": TipoEvento.ANIMAL_ADOPTED.value,
                "descripcion": "Animal adoptado - Aplica descuento automático del 20%",
                "datos_requeridos": ["usuario_email", "animal_id"],
                "datos_opcionales": ["animal_tipo", "animal_nombre", "fecha_adopcion", "refugio"]
            },
            {
                "tipo": TipoEvento.ADOPTION_COMPLETED.value,
                "descripcion": "Adopción completada - Confirmación final",
                "datos_requeridos": ["usuario_email"],
                "datos_opcionales": ["adoption_id", "fecha_completado"]
            }
        ],
        "eventos_salientes": [
            {
                "tipo": TipoEvento.DISCOUNT_APPLIED.value,
                "descripcion": "Descuento aplicado - Notificación al partner",
                "datos_incluidos": ["usuario_email", "descuento_id", "porcentaje", "fecha_aplicado"]
            },
            {
                "tipo": TipoEvento.SUBSCRIPTION_CREATED.value,
                "descripcion": "Suscripción creada - Nuevo usuario premium",
                "datos_incluidos": ["usuario_id", "usuario_email", "tipo", "fecha_inicio"]
            }
        ]
    }


# ========== CONEXION CON PAGINA EXTERNA ==========

@router.get("/external-page/status")
async def estado_pagina_externa():
    """
    Muestra el estado de conexión con la página externa configurada.
    """
    from app.config import configuracion
    import httpx
    
    url = configuracion.EXTERNAL_PAGE_URL
    
    if not url:
        return {
            "configurada": False,
            "mensaje": "No hay URL de página externa configurada en .env (EXTERNAL_PAGE_URL)"
        }
    
    # Intentar conectar
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            return {
                "configurada": True,
                "url": url,
                "conectada": True,
                "status_code": response.status_code,
                "mensaje": "Conexión exitosa con la página externa"
            }
    except Exception as e:
        return {
            "configurada": True,
            "url": url,
            "conectada": False,
            "error": str(e),
            "mensaje": "No se pudo conectar con la página externa"
        }


@router.post("/external-page/send")
async def enviar_a_pagina_externa(datos: Dict[str, Any]):
    """
    Envia datos a la página externa configurada.
    
    Ejemplo de uso:
    ```json
    {
        "evento": "test",
        "mensaje": "Hola desde el servicio de pagos",
        "datos": {"foo": "bar"}
    }
    ```
    """
    from app.config import configuracion
    import httpx
    
    url = configuracion.EXTERNAL_PAGE_URL
    
    if not url:
        raise HTTPException(
            status_code=400, 
            detail="No hay URL de página externa configurada. Agregar EXTERNAL_PAGE_URL en .env"
        )
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                json=datos,
                headers={"Content-Type": "application/json"}
            )
            return {
                "enviado": True,
                "url": url,
                "status_code": response.status_code,
                "respuesta": response.text[:500] if response.text else None
            }
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error al enviar a página externa: {str(e)}"
        )

