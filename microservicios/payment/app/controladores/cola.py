"""
Controlador de cola con prioridad.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.servicios.cola_premium import ServicioPrioridad, ColaPremium

router = APIRouter(prefix="/cola", tags=["Cola Premium"])


class AgregarColaRequest(BaseModel):
    """Request para agregar a la cola."""
    cita_id: str
    negocio_id: str
    usuario_id: str
    es_premium: bool = False
    datos: Optional[Dict[str, Any]] = None


@router.post("/agregar")
async def agregar_a_cola(request: AgregarColaRequest):
    """
    Agrega una cita a la cola de atencion.
    
    Las citas de negocios premium tienen prioridad automatica.
    """
    resultado = await ServicioPrioridad.agregar_a_cola(
        cita_id=request.cita_id,
        negocio_id=request.negocio_id,
        usuario_id=request.usuario_id,
        es_premium=request.es_premium,
        datos=request.datos
    )
    return resultado


@router.get("/siguiente/{negocio_id}")
async def obtener_siguiente(negocio_id: str):
    """
    Obtiene y remueve la siguiente cita a atender.
    
    Respeta el orden de prioridad (premium primero).
    """
    resultado = await ServicioPrioridad.obtener_siguiente(negocio_id)
    if not resultado:
        return {"mensaje": "No hay citas en la cola", "siguiente": None}
    return {"siguiente": resultado}


@router.get("/posicion/{cita_id}")
async def consultar_posicion(cita_id: str):
    """
    Consulta la posicion de una cita en la cola.
    """
    return await ServicioPrioridad.consultar_posicion(cita_id)


@router.delete("/cancelar/{cita_id}")
async def cancelar_cita_cola(cita_id: str):
    """
    Remueve una cita de la cola.
    """
    eliminado = await ServicioPrioridad.cancelar_cita_cola(cita_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Cita no encontrada en la cola")
    return {"mensaje": "Cita removida de la cola"}


@router.get("/negocio/{negocio_id}")
async def obtener_cola_negocio(negocio_id: str):
    """
    Obtiene el estado completo de la cola de un negocio.
    
    Incluye estadisticas y lista ordenada de citas.
    """
    return await ServicioPrioridad.obtener_cola_negocio(negocio_id)


@router.get("/estadisticas/{negocio_id}")
async def estadisticas_cola(negocio_id: str):
    """
    Obtiene estadisticas de la cola de un negocio.
    """
    return ColaPremium.estadisticas(negocio_id)


@router.delete("/limpiar/{negocio_id}")
async def limpiar_cola(negocio_id: str):
    """
    Limpia la cola de un negocio (solo para administradores).
    """
    ColaPremium.limpiar(negocio_id)
    return {"mensaje": f"Cola del negocio {negocio_id} limpiada"}
