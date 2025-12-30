"""
Herramienta MCP: Consultar Citas
Consulta las citas de un usuario o negocio
"""
import httpx
from typing import Dict, Any

from app.config import config


async def consultar_citas(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Consulta las citas según filtros.
    
    Args:
        data: Diccionario con:
            - cliente_id (str, opcional): ID del cliente
            - negocio_id (str, opcional): ID del negocio
            - estado (str, opcional): Estado de la cita (pendiente, atendida, cancelada)
            - fecha_inicio (str, opcional): Fecha de inicio del rango (YYYY-MM-DD)
            - fecha_fin (str, opcional): Fecha de fin del rango (YYYY-MM-DD)
    
    Returns:
        Dict con las citas encontradas
    """
    try:
        base_url = config.REST_API_URL
        
        # Construir query params
        params = {}
        
        if data.get("cliente_id"):
            params["cliente_id"] = data["cliente_id"]
        if data.get("negocio_id"):
            params["negocio_id"] = data["negocio_id"]
        if data.get("estado"):
            params["estado"] = data["estado"]
        if data.get("fecha_inicio"):
            params["fecha_inicio"] = data["fecha_inicio"]
        if data.get("fecha_fin"):
            params["fecha_fin"] = data["fecha_fin"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/citas",
                params=params,
                timeout=10.0
            )
            response.raise_for_status()
            
            citas = response.json()
            
            return {
                "exito": True,
                "total": len(citas) if isinstance(citas, list) else citas.get("total", 0),
                "citas": citas
            }
    
    except httpx.HTTPError as e:
        return {
            "exito": False,
            "error": f"Error al consultar citas: {str(e)}"
        }
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error inesperado: {str(e)}"
        }
