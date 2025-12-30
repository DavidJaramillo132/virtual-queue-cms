"""
Herramienta MCP: Ver Horarios Disponibles
Obtiene los horarios disponibles para un negocio y servicio específico
"""
import httpx
from typing import Dict, Any
from datetime import datetime, time, timedelta

from app.config import config


async def ver_horarios_disponibles(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Obtiene los horarios disponibles para agendar una cita.
    
    Args:
        data: Diccionario con:
            - negocio_id (str): ID del negocio
            - servicio_id (str, opcional): ID del servicio específico
            - fecha (str, opcional): Fecha en formato YYYY-MM-DD
            - estacion_id (str): ID de la estación
    
    Returns:
        Dict con los horarios disponibles
    """
    negocio_id = data.get("negocio_id")
    servicio_id = data.get("servicio_id")
    fecha_str = data.get("fecha", datetime.now().strftime("%Y-%m-%d"))
    estacion_id = data.get("estacion_id")
    
    if not negocio_id:
        return {
            "exito": False,
            "error": "El campo 'negocio_id' es requerido"
        }
    
    if not estacion_id:
        return {
            "exito": False,
            "error": "El campo 'estacion_id' es requerido para ver horarios"
        }
    
    try:
        base_url = config.REST_API_URL
        
        async with httpx.AsyncClient() as client:
            # Obtener información del servicio para saber la duración
            response_servicio = await client.get(
                f"{base_url}/servicios/{servicio_id}",
                timeout=10.0
            )
            response_servicio.raise_for_status()
            servicio = response_servicio.json()
            duracion_minutos = servicio.get('duracion_minutos', 30)
            
            # Obtener horarios de la estación
            response = await client.get(
                f"{base_url}/horarios",
                params={"estacion_id": estacion_id},
                timeout=10.0
            )
            response.raise_for_status()
            horarios = response.json()
            
            # Si no hay horarios, retornar vacío
            if not horarios:
                return {
                    "exito": True,
                    "horarios": [],
                    "mensaje": "No hay horarios configurados para esta estación"
                }
            
            # Filtrar por día de la semana si se especificó fecha
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d")
            dia_semana = fecha.weekday()  # 0 (lunes) a 6 (domingo)
            # Ajustar para que coincida con el formato 0=domingo de la BD
            dia_semana_bd = (dia_semana + 1) % 7
            
            horarios_dia = [h for h in horarios if h.get("dia_semana") == dia_semana_bd]
            
            if not horarios_dia:
                return {
                    "exito": True,
                    "horarios": [],
                    "mensaje": f"No hay horarios configurados para el {fecha_str}"
                }
            
            # Obtener citas existentes para verificar disponibilidad
            response_citas = await client.get(
                f"{base_url}/citas",
                params={
                    "estacion_id": estacion_id,
                    "fecha": fecha_str
                },
                timeout=10.0
            )
            response_citas.raise_for_status()
            citas_existentes = response_citas.json()
            
            # Generar slots de tiempo
            slots_disponibles = []
            hora_actual = datetime.now()
            
            for horario in horarios_dia:
                hora_inicio_str = horario.get('hora_inicio')
                hora_fin_str = horario.get('hora_fin')
                
                # Convertir a objetos time
                hora_inicio = datetime.strptime(hora_inicio_str, "%H:%M:%S").time()
                hora_fin = datetime.strptime(hora_fin_str, "%H:%M:%S").time()
                
                # Generar slots de tiempo según la duración del servicio
                slot_inicio = datetime.combine(fecha.date(), hora_inicio)
                slot_fin_maximo = datetime.combine(fecha.date(), hora_fin)
                
                while slot_inicio + timedelta(minutes=duracion_minutos) <= slot_fin_maximo:
                    slot_fin = slot_inicio + timedelta(minutes=duracion_minutos)
                    
                    # Verificar si el slot ya pasó
                    if slot_inicio <= hora_actual:
                        slot_inicio = slot_fin
                        continue
                    
                    # Verificar si el slot está ocupado
                    ocupado = False
                    for cita in citas_existentes:
                        if cita.get('estado') != 'cancelada':
                            cita_inicio_str = f"{fecha_str} {cita.get('hora_inicio')}"
                            cita_fin_str = f"{fecha_str} {cita.get('hora_fin')}"
                            cita_inicio = datetime.strptime(cita_inicio_str, "%Y-%m-%d %H:%M:%S")
                            cita_fin = datetime.strptime(cita_fin_str, "%Y-%m-%d %H:%M:%S")
                            
                            # Verificar solapamiento
                            if (slot_inicio < cita_fin and slot_fin > cita_inicio):
                                ocupado = True
                                break
                    
                    if not ocupado:
                        slots_disponibles.append({
                            "hora_inicio": slot_inicio.strftime("%H:%M:%S"),
                            "hora_fin": slot_fin.strftime("%H:%M:%S"),
                            "duracion_minutos": duracion_minutos
                        })
                    
                    slot_inicio = slot_fin
            
            return {
                "exito": True,
                "fecha": fecha_str,
                "dia_semana": dia_semana_bd,
                "horarios": slots_disponibles[:10],  # Limitar a 10 slots
                "total": len(slots_disponibles),
                "mensaje": f"Se encontraron {len(slots_disponibles)} horarios disponibles para el {fecha_str}"
            }
    
    except httpx.HTTPError as e:
        return {
            "exito": False,
            "error": f"Error al consultar horarios: {str(e)}"
        }
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error inesperado: {str(e)}"
        }
