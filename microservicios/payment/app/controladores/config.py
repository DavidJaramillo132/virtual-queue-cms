"""
Controlador de configuración pública.
Endpoints para obtener configuración que el frontend necesita.
"""
from fastapi import APIRouter, HTTPException
from app.config import configuracion

router = APIRouter(prefix="/config", tags=["Configuración"])


@router.get("/stripe")
async def obtener_config_stripe():
    """
    Obtiene la configuración pública de Stripe.
    
    Retorna la clave pública (publishable key) necesaria para el frontend.
    """
    if configuracion.PASARELA_ACTIVA != "stripe":
        raise HTTPException(
            status_code=400,
            detail="Stripe no está configurado como pasarela activa"
        )
    
    if not configuracion.STRIPE_PUBLISHABLE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Clave pública de Stripe no configurada"
        )
    
    return {
        "publishable_key": configuracion.STRIPE_PUBLISHABLE_KEY,
        "pasarela": "stripe",
        "activa": True
    }


@router.get("/info")
async def obtener_info_general():
    """
    Obtiene información general del servicio de pagos.
    
    NO incluye secretos ni claves privadas.
    """
    return configuracion.obtener_info()
