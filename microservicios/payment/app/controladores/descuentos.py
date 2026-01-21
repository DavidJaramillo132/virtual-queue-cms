"""
Controlador de descuentos.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import pydantic

from app.servicios.descuentos import ServicioDescuentos, AlmacenDescuentos

router = APIRouter(prefix="/descuentos", tags=["Descuentos"])


@router.get("/usuario/{usuario_id}")
async def obtener_descuentos_usuario(usuario_id: str):
    """
    Obtiene todos los descuentos activos de un usuario.
    """
    descuentos = await ServicioDescuentos.obtener_descuentos_usuario(usuario_id)
    
    return {
        "usuario_id": usuario_id,
        "total_descuentos": len(descuentos),
        "descuentos": descuentos
    }


class ReclamarDescuentoRequest(pydantic.BaseModel):
    usuario_id: str
    email: str

@router.post("/reclamar")
async def reclamar_descuentos(request: ReclamarDescuentoRequest):
    """
    Reclama descuentos pendientes por email para un usuario.
    útil cuando el evento de descuento llega antes de que el usuario se registre.
    """
    resultado = await ServicioDescuentos.reclamar_descuentos_pendientes(
        email=request.email,
        usuario_id=request.usuario_id
    )
    return resultado

@router.get("/stats")
async def obtener_estadisticas_descuentos():
    """
    Obtiene estadísticas generales de descuentos.
    """
    todos_descuentos = []
    for usuario_id in AlmacenDescuentos._por_usuario:
        descuentos = AlmacenDescuentos.obtener_por_usuario(usuario_id, solo_activos=False)
        todos_descuentos.extend(descuentos)
    
    activos = [d for d in todos_descuentos if d.activo]
    por_tipo = {}
    
    for descuento in todos_descuentos:
        tipo = descuento.tipo.value
        if tipo not in por_tipo:
            por_tipo[tipo] = {"total": 0, "activos": 0}
        por_tipo[tipo]["total"] += 1
        if descuento.activo:
            por_tipo[tipo]["activos"] += 1
    
    return {
        "total_descuentos": len(todos_descuentos),
        "descuentos_activos": len(activos),
        "por_tipo": por_tipo,
        "usuarios_con_descuento": len(AlmacenDescuentos._por_usuario),
        "descuentos_pendientes_email": len(AlmacenDescuentos._pendientes_por_email)
    }
