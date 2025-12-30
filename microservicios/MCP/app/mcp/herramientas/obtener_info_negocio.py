"""
Herramienta MCP: Obtener Información de Negocio
Obtiene la información detallada de un negocio específico
"""
import httpx
from typing import Dict, Any

from app.config import config


async def obtener_info_negocio(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Obtiene información detallada de un negocio.
    
    Args:
        data: Diccionario con:
            - negocio_id (str): ID del negocio
    
    Returns:
        Dict con la información del negocio
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
                f"{base_url}/negocios/{negocio_id}",
                timeout=10.0
            )
            response.raise_for_status()
            
            negocio = response.json()
            
            return {
                "exito": True,
                "negocio": negocio
            }
    
    except httpx.HTTPError as e:
        return {
            "exito": False,
            "error": f"Error al obtener información del negocio: {str(e)}"
        }
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error inesperado: {str(e)}"
        }
