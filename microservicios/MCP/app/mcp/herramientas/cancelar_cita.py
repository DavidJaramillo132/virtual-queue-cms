"""
Herramienta MCP: Cancelar Cita
Cancela una cita existente en el sistema
"""
import httpx
from typing import Dict, Any

from app.config import config


async def cancelar_cita(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cancela una cita existente.
    
    Args:
        data: Diccionario con:
            - cita_id (str): ID de la cita a cancelar
            - motivo (str, opcional): Motivo de la cancelación
    
    Returns:
        Dict con el resultado de la cancelación
    """
    cita_id = data.get("cita_id")
    
    if not cita_id:
        return {
            "exito": False,
            "error": "El campo 'cita_id' es requerido"
        }
    
    try:
        base_url = config.REST_API_URL
        
        payload = {
            "estado": "cancelada"
        }
        
        if data.get("motivo"):
            payload["motivo"] = data["motivo"]
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{base_url}/citas/{cita_id}",
                json=payload,
                timeout=10.0
            )
            response.raise_for_status()
            
            return {
                "exito": True,
                "mensaje": "Cita cancelada exitosamente",
                "cita": response.json()
            }
    
    except httpx.HTTPError as e:
        return {
            "exito": False,
            "error": f"Error al cancelar la cita: {str(e)}"
        }
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error inesperado: {str(e)}"
        }
