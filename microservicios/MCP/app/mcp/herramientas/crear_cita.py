"""
Herramienta MCP: Crear Cita
Crea una nueva cita en el sistema
"""
import httpx
from typing import Dict, Any

from app.config import config


async def crear_cita(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Crea una nueva cita en el sistema.
    
    Args:
        data: Diccionario con:
            - cliente_id (str): ID del cliente
            - negocio_id (str): ID del negocio
            - servicio_id (str): ID del servicio
            - estacion_id (str): ID de la estación
            - fecha (str): Fecha en formato YYYY-MM-DD
            - hora_inicio (str): Hora de inicio en formato HH:MM
            - hora_fin (str): Hora de fin en formato HH:MM
    
    Returns:
        Dict con la información de la cita creada
    """
    campos_requeridos = ["cliente_id", "negocio_id", "servicio_id", "estacion_id", "fecha", "hora_inicio", "hora_fin"]
    
    # Validar campos requeridos
    for campo in campos_requeridos:
        if not data.get(campo):
            return {
                "exito": False,
                "error": f"El campo '{campo}' es requerido"
            }
    
    try:
        base_url = config.REST_API_URL
        
        # Primero verificar disponibilidad consultando citas existentes
        async with httpx.AsyncClient() as client:
            # Verificar si ya existe una cita en ese horario
            response_check = await client.get(
                f"{base_url}/citas",
                params={
                    "estacion_id": data["estacion_id"],
                    "fecha": data["fecha"]
                },
                timeout=10.0
            )
            response_check.raise_for_status()
            citas_existentes = response_check.json()
            
            # Verificar conflictos de horario
            hora_inicio = data["hora_inicio"]
            hora_fin = data["hora_fin"]
            
            for cita in citas_existentes:
                # Solo considerar citas no canceladas
                if cita.get('estado') != 'cancelada':
                    cita_inicio = cita.get('hora_inicio', '')
                    cita_fin = cita.get('hora_fin', '')
                    
                    # Verificar si hay solapamiento
                    if (hora_inicio < cita_fin and hora_fin > cita_inicio):
                        return {
                            "exito": False,
                            "error": f"El horario de {hora_inicio} a {hora_fin} no está disponible. Ya existe una cita en ese horario."
                        }
            
            # Si no hay conflictos, crear la cita
            payload = {
                "cliente_id": data["cliente_id"],
                "negocio_id": data["negocio_id"],
                "servicio_id": data["servicio_id"],
                "estacion_id": data["estacion_id"],
                "fecha": data["fecha"],
                "hora_inicio": data["hora_inicio"],
                "hora_fin": data["hora_fin"]
            }
            
            response = await client.post(
                f"{base_url}/citas",
                json=payload,
                timeout=10.0
            )
            response.raise_for_status()
            
            cita_creada = response.json()
            
            return {
                "exito": True,
                "mensaje": "Cita creada exitosamente",
                "cita": cita_creada
            }
    
    except httpx.HTTPError as e:
        return {
            "exito": False,
            "error": f"Error al crear la cita: {str(e)}"
        }
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error inesperado: {str(e)}"
        }
