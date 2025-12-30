"""
Herramienta MCP: Buscar Negocios
Busca negocios por diferentes criterios
"""
import httpx
from typing import Dict, Any

from app.config import config


async def buscar_negocios(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Busca negocios según criterios.
    
    Args:
        data: Diccionario con:
            - nombre (str, opcional): Nombre del negocio a buscar
            - categoria (str, opcional): Categoría del negocio
            - estado (bool, opcional): Estado activo/inactivo
            - limite (int, opcional): Límite de resultados
    
    Returns:
        Dict con los negocios encontrados
    """
    try:
        base_url = config.REST_API_URL
        
        # Construir query params
        params = {}
        
        if data.get("nombre"):
            params["nombre"] = data["nombre"]
        if data.get("categoria"):
            params["categoria"] = data["categoria"]
        if data.get("estado") is not None:
            params["estado"] = data["estado"]
        if data.get("limite"):
            params["limite"] = data["limite"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/negocios",
                params=params,
                timeout=10.0
            )
            response.raise_for_status()
            
            negocios = response.json()
            
            return {
                "exito": True,
                "total": len(negocios) if isinstance(negocios, list) else negocios.get("total", 0),
                "negocios": negocios
            }
    
    except httpx.HTTPError as e:
        return {
            "exito": False,
            "error": f"Error al buscar negocios: {str(e)}"
        }
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error inesperado: {str(e)}"
        }
