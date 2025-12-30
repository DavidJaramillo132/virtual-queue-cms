"""
Herramienta MCP: Obtener Estaciones
Obtiene las estaciones disponibles de un negocio
"""
import httpx
from typing import Dict, Any

from app.config import config


async def obtener_estaciones(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Obtiene las estaciones de un negocio.
    
    Args:
        data: Diccionario con:
            - negocio_id (str): ID del negocio
    
    Returns:
        Dict con las estaciones encontradas
    """
    negocio_id = data.get("negocio_id")
    
    if not negocio_id:
        return {
            "exito": False,
            "error": "El campo 'negocio_id' es requerido"
        }
    
    try:
        base_url = config.REST_API_URL
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/estaciones/negocio/{negocio_id}",
                timeout=10.0
            )
            response.raise_for_status()
            
            estaciones = response.json()
            
            return {
                "exito": True,
                "total": len(estaciones) if isinstance(estaciones, list) else estaciones.get("total", 0),
                "estaciones": estaciones
            }
    
    except httpx.HTTPError as e:
        return {
            "exito": False,
            "error": f"Error al obtener estaciones: {str(e)}"
        }
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error inesperado: {str(e)}"
        }
