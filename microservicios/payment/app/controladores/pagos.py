"""
Controlador de pagos.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from app.modelos.pago import (
    CrearPagoRequest,
    PagoResponse,
    ReembolsoRequest,
    ReembolsoResponse,
    EstadoPago
)
from app.adaptador import obtener_adaptador, AdaptadorFactory

router = APIRouter(prefix="/pagos", tags=["Pagos"])


@router.post("/", response_model=PagoResponse)
async def crear_pago(request: CrearPagoRequest):
    """
    Crea un nuevo pago.
    
    El pago se procesa a traves de la pasarela configurada (mock, stripe, mercadopago).
    """
    adaptador = obtener_adaptador()
    
    resultado = await adaptador.crear_pago(
        monto=request.monto,
        moneda=request.moneda,
        descripcion=request.descripcion or f"Pago para negocio {request.negocio_id}",
        metadatos={
            "negocio_id": request.negocio_id,
            "usuario_id": request.usuario_id,
            **(request.metadatos or {})
        }
    )
    
    if not resultado.exitoso:
        raise HTTPException(status_code=400, detail=resultado.error)
    
    from datetime import datetime
    return PagoResponse(
        id=resultado.id_transaccion,
        negocio_id=request.negocio_id,
        usuario_id=request.usuario_id,
        monto=resultado.monto,
        moneda=resultado.moneda,
        estado=resultado.estado,
        tipo=request.tipo,
        pasarela=adaptador.nombre,
        id_transaccion_externa=resultado.id_externo,
        url_checkout=resultado.url_checkout,
        descripcion=request.descripcion,
        metadatos=resultado.metadatos or {},
        creado_en=datetime.utcnow(),
        actualizado_en=datetime.utcnow()
    )


@router.get("/{pago_id}")
async def obtener_pago(pago_id: str):
    """
    Obtiene el estado de un pago.
    """
    adaptador = obtener_adaptador()
    resultado = await adaptador.verificar_pago(pago_id)
    
    if not resultado.exitoso:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    return {
        "id": pago_id,
        "estado": resultado.estado.value,
        "monto": resultado.monto,
        "moneda": resultado.moneda,
        "pasarela": adaptador.nombre,
        "metadatos": resultado.metadatos
    }


@router.post("/reembolso")
async def procesar_reembolso(request: ReembolsoRequest):
    """
    Procesa un reembolso total o parcial.
    """
    adaptador = obtener_adaptador()
    
    resultado = await adaptador.procesar_reembolso(
        id_transaccion=request.pago_id,
        monto=request.monto,
        razon=request.razon
    )
    
    if not resultado.exitoso:
        raise HTTPException(status_code=400, detail=resultado.error)
    
    from datetime import datetime
    return ReembolsoResponse(
        id=resultado.id_reembolso,
        pago_id=request.pago_id,
        monto=resultado.monto,
        estado=resultado.estado,
        razon=request.razon,
        creado_en=datetime.utcnow()
    )


@router.get("/pasarelas/disponibles")
async def listar_pasarelas():
    """
    Lista las pasarelas de pago disponibles.
    """
    return {
        "pasarelas": AdaptadorFactory.listar_disponibles(),
        "activa": obtener_adaptador().nombre
    }
