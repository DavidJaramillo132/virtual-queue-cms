"""
Herramienta MCP: Obtener Servicios
Obtiene los servicios disponibles de un negocio
"""
import httpx
from typing import Dict, Any

from app.config import config


async def obtener_servicios(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Obtiene los servicios de un negocio.
    
    Args:
        data: Diccionario con:
            - negocio_id (str): ID del negocio
            - nombre (str, opcional): Filtrar por nombre del servicio
    
    Returns:
        Dict con los servicios encontrados
    """
    negocio_id = data.get("negocio_id")
    
    if not negocio_id:
        return {
            "exito": False,
            "error": "El campo 'negocio_id' es requerido"
        }
    
    try:
        base_url = config.REST_API_URL
        
        # Construir query params
        params = {"negocio_id": negocio_id}
        if data.get("nombre"):
            params["nombre"] = data["nombre"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/servicios",
                params=params,
                timeout=10.0
            )
            response.raise_for_status()
            
            servicios = response.json()
            
            return {
                "exito": True,
                "total": len(servicios) if isinstance(servicios, list) else servicios.get("total", 0),
                "servicios": servicios
            }
    
    except httpx.HTTPError as e:
        return {
            "exito": False,
            "error": f"Error al obtener servicios: {str(e)}"
        }
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error inesperado: {str(e)}"
        }
