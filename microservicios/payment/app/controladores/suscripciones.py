"""
Controlador de suscripciones premium.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.modelos.suscripcion import (
    CrearSuscripcionRequest,
    SuscripcionResponse,
    CancelarSuscripcionRequest,
    VerificarPremiumResponse,
    TipoSuscripcion
)
from app.servicios.suscripciones import ServicioSuscripciones

router = APIRouter(prefix="/suscripciones", tags=["Suscripciones Premium"])


@router.post("", response_model=SuscripcionResponse)
@router.post("/", response_model=SuscripcionResponse)
async def crear_suscripcion(request: CrearSuscripcionRequest):
    """
    Crea una nueva suscripcion premium para un usuario.
    
    Por defecto inicia con un periodo de prueba gratuito.
    Los beneficios se activan inmediatamente.
    """
    try:
        suscripcion = await ServicioSuscripciones.crear_suscripcion(request)
        return suscripcion
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{suscripcion_id}", response_model=SuscripcionResponse)
async def obtener_suscripcion(suscripcion_id: str):
    """
    Obtiene los detalles de una suscripcion.
    """
    suscripcion = await ServicioSuscripciones.obtener_suscripcion(suscripcion_id)
    if not suscripcion:
        raise HTTPException(status_code=404, detail="Suscripcion no encontrada")
    return suscripcion


@router.get("/usuario/{usuario_id}", response_model=SuscripcionResponse)
async def obtener_suscripcion_usuario(usuario_id: str):
    """
    Obtiene la suscripcion de un usuario especifico.
    """
    suscripcion = await ServicioSuscripciones.obtener_por_usuario(usuario_id)
    if not suscripcion:
        raise HTTPException(status_code=404, detail="El usuario no tiene suscripcion")
    return suscripcion


@router.get("/usuario/{usuario_id}/verificar", response_model=VerificarPremiumResponse)
async def verificar_premium(usuario_id: str):
    """
    Verifica si un usuario tiene suscripcion premium activa.
    
    Retorna el estado premium y los beneficios disponibles.
    """
    return await ServicioSuscripciones.verificar_premium(usuario_id)


@router.post("/cancelar", response_model=SuscripcionResponse)
async def cancelar_suscripcion(request: CancelarSuscripcionRequest):
    """
    Cancela una suscripcion.
    
    Por defecto, la suscripcion permanece activa hasta el final del periodo pagado.
    Si cancelar_inmediatamente es True, se cancela al instante.
    """
    suscripcion = await ServicioSuscripciones.cancelar_suscripcion(request)
    if not suscripcion:
        raise HTTPException(status_code=404, detail="Suscripcion no encontrada")
    return suscripcion


@router.post("/{suscripcion_id}/renovar", response_model=SuscripcionResponse)
async def renovar_suscripcion(suscripcion_id: str):
    """
    Renueva una suscripcion manualmente.
    
    Normalmente esto se hace automaticamente via webhooks de pago.
    """
    suscripcion = await ServicioSuscripciones.renovar_suscripcion(suscripcion_id)
    if not suscripcion:
        raise HTTPException(status_code=404, detail="Suscripcion no encontrada")
    return suscripcion


@router.get("/premium/usuarios", response_model=List[str])
async def listar_usuarios_premium():
    """
    Lista los IDs de todos los usuarios con suscripcion premium activa.
    
    Util para el frontend para identificar usuarios VIP.
    """
    return await ServicioSuscripciones.listar_usuarios_premium()


@router.get("/planes/info")
async def obtener_info_planes():
    """
    Obtiene informacion sobre los planes de suscripcion disponibles.
    """
    from app.config import configuracion
    from app.modelos.suscripcion import BeneficiosPremium
    
    beneficios = BeneficiosPremium()
    
    return {
        "planes": [
            {
                "tipo": TipoSuscripcion.PREMIUM.value,
                "nombre": "Premium",
                "precio_mensual": configuracion.PRECIO_SUSCRIPCION_MENSUAL,
                "moneda": "USD",
                "dias_prueba": configuracion.DIAS_PRUEBA_GRATIS,
                "beneficios": {
                    "prioridad_cola": beneficios.prioridad_cola,
                    "fila_vip": beneficios.fila_vip,
                    "reservas_prioritarias": beneficios.reservas_prioritarias,
                    "cancelacion_flexible": beneficios.cancelacion_flexible,
                    "soporte_prioritario": beneficios.soporte_prioritario,
                    "notificaciones_avanzadas": beneficios.notificaciones_avanzadas,
                    "sin_publicidad": beneficios.sin_publicidad,
                    "limite_citas_diarias": beneficios.limite_citas_diarias
                }
            }
        ]
    }
