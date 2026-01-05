"""
Controlador de partners B2B.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.modelos.partner import (
    RegistrarPartnerRequest,
    PartnerResponse,
    ActualizarPartnerRequest,
    TipoEvento
)
from app.partners.servicio import ServicioPartners

router = APIRouter(prefix="/partners", tags=["Partners B2B"])


@router.post("/register", response_model=PartnerResponse)
async def registrar_partner(request: RegistrarPartnerRequest):
    """
    Registra un nuevo partner B2B.
    
    Al registrarse, el partner recibe:
    - Un ID unico
    - Un secreto HMAC para verificar webhooks
    - Confirmacion de los eventos suscritos
    
    El partner debe guardar el HMAC secret de forma segura,
    ya que se usara para firmar todos los webhooks enviados.
    """
    try:
        partner = await ServicioPartners.registrar_partner(request)
        return partner
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[PartnerResponse])
async def listar_partners(
    solo_activos: bool = Query(True, description="Solo listar partners activos")
):
    """
    Lista todos los partners registrados.
    """
    return await ServicioPartners.listar_partners(solo_activos)


@router.get("/{partner_id}", response_model=PartnerResponse)
async def obtener_partner(partner_id: str):
    """
    Obtiene informacion de un partner especifico.
    """
    partner = await ServicioPartners.obtener_partner(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner no encontrado")
    return partner


@router.patch("/{partner_id}", response_model=PartnerResponse)
async def actualizar_partner(partner_id: str, request: ActualizarPartnerRequest):
    """
    Actualiza un partner existente.
    
    Si regenerar_secret es True, se genera un nuevo HMAC secret.
    """
    partner = await ServicioPartners.actualizar_partner(partner_id, request)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner no encontrado")
    return partner


@router.delete("/{partner_id}")
async def eliminar_partner(partner_id: str):
    """
    Elimina un partner.
    """
    eliminado = await ServicioPartners.eliminar_partner(partner_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Partner no encontrado")
    return {"mensaje": "Partner eliminado correctamente"}


@router.get("/eventos/disponibles")
async def listar_eventos_disponibles():
    """
    Lista todos los tipos de eventos disponibles para suscripcion.
    """
    return {
        "eventos": [
            {
                "tipo": evento.value,
                "nombre": evento.name,
                "descripcion": _obtener_descripcion_evento(evento)
            }
            for evento in TipoEvento
        ]
    }


@router.post("/verificar-webhook")
async def verificar_webhook_url(webhook_url: str):
    """
    Verifica que una URL de webhook sea accesible.
    
    Envia un ping de prueba para confirmar conectividad.
    """
    resultado = await ServicioPartners.verificar_webhook_url(webhook_url)
    return resultado


@router.post("/notificar/{evento}")
async def enviar_notificacion_manual(
    evento: TipoEvento,
    datos: dict
):
    """
    Envia una notificacion manual a todos los partners suscritos.
    
    Util para testing o para disparar eventos manualmente.
    """
    resultado = await ServicioPartners.notificar_evento(
        evento=evento,
        datos=datos,
        metadatos={"origen": "manual"}
    )
    return resultado


def _obtener_descripcion_evento(evento: TipoEvento) -> str:
    """Obtiene la descripcion de un tipo de evento."""
    descripciones = {
        TipoEvento.BOOKING_CONFIRMED: "Se confirma una reserva/cita",
        TipoEvento.BOOKING_CANCELLED: "Se cancela una reserva/cita",
        TipoEvento.BOOKING_UPDATED: "Se actualiza una reserva/cita",
        TipoEvento.BOOKING_COMPLETED: "Se completa una reserva/cita",
        TipoEvento.PAYMENT_SUCCESS: "Pago procesado exitosamente",
        TipoEvento.PAYMENT_FAILED: "Fallo en el procesamiento del pago",
        TipoEvento.PAYMENT_REFUNDED: "Se proceso un reembolso",
        TipoEvento.SUBSCRIPTION_CREATED: "Se crea una suscripcion",
        TipoEvento.SUBSCRIPTION_ACTIVATED: "Se activa una suscripcion",
        TipoEvento.SUBSCRIPTION_CANCELLED: "Se cancela una suscripcion",
        TipoEvento.SUBSCRIPTION_RENEWED: "Se renueva una suscripcion",
        TipoEvento.SERVICE_ACTIVATED: "Se activa un servicio",
        TipoEvento.SERVICE_DEACTIVATED: "Se desactiva un servicio",
        TipoEvento.BUSINESS_CREATED: "Se crea un negocio",
        TipoEvento.BUSINESS_UPDATED: "Se actualiza un negocio",
        TipoEvento.ORDER_CREATED: "Se crea una orden",
        TipoEvento.TOUR_PURCHASED: "Se compra un tour",
        TipoEvento.EXTERNAL_SERVICE: "Evento de servicio externo"
    }
    return descripciones.get(evento, "Sin descripcion")
