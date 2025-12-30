"""
Módulo de herramientas MCP
Exporta todas las herramientas disponibles y funciones de registro
"""

from typing import Dict, Callable, Any
from .ver_horarios_disponibles import ver_horarios_disponibles
from .crear_cita import crear_cita
from .cancelar_cita import cancelar_cita
from .consultar_citas import consultar_citas
from .buscar_negocios import buscar_negocios
from .obtener_servicios import obtener_servicios
from .obtener_info_negocio import obtener_info_negocio
from .obtener_estaciones import obtener_estaciones


def obtener_herramientas_disponibles() -> Dict[str, Callable]:
    """
    Retorna un diccionario con todas las herramientas MCP disponibles.
    
    Returns:
        Dict con nombre de herramienta -> función callable
    """
    return {
        "ver_horarios_disponibles": ver_horarios_disponibles,
        "crear_cita": crear_cita,
        "cancelar_cita": cancelar_cita,
        "consultar_citas": consultar_citas,
        "buscar_negocios": buscar_negocios,
        "obtener_servicios": obtener_servicios,
        "obtener_info_negocio": obtener_info_negocio,
        "obtener_estaciones": obtener_estaciones
    }


def obtener_definiciones_herramientas() -> list[Dict[str, Any]]:
    """
    Retorna las definiciones de herramientas en formato MCP estándar.
    Estas definiciones son usadas por el orquestrador para comunicarse con el LLM.
    
    Returns:
        Lista de definiciones de herramientas
    """
    return [
        {
            "nombre": "ver_horarios_disponibles",
            "descripcion": "ÚSALO cuando el usuario ELIGE una estación. Obtiene los horarios disponibles y muéstrale opciones de fecha/hora para que elija.",
            "parametros": {
                "negocio_id": {
                    "type": "string",
                    "description": "ID único del negocio previamente elegido (UUID)"
                },
                "servicio_id": {
                    "type": "string",
                    "description": "ID del servicio previamente elegido (UUID, opcional)"
                },
                "fecha": {
                    "type": "string",
                    "description": "Fecha en formato YYYY-MM-DD (opcional, por defecto hoy)"
                },
                "estacion_id": {
                    "type": "string",
                    "description": "ID de la estación previamente elegida (UUID, opcional)"
                }
            },
            "requeridos": ["negocio_id"]
        },
        {
            "nombre": "crear_cita",
            "descripcion": "Crea una nueva cita en el sistema. SOLO USA ESTA HERRAMIENTA cuando ya tengas TODOS los datos necesarios: cliente_id (obtenido automáticamente), negocio_id, servicio_id, estacion_id, fecha, hora_inicio y hora_fin. NUNCA pidas estos datos directamente al usuario, guíalo paso a paso usando las otras herramientas primero.",
            "parametros": {
                "cliente_id": {
                    "type": "string",
                    "description": "ID del cliente que agenda la cita (UUID) - Se obtiene automáticamente del sistema"
                },
                "negocio_id": {
                    "type": "string",
                    "description": "ID del negocio donde se agenda la cita (UUID) - Obtener de buscar_negocios"
                },
                "servicio_id": {
                    "type": "string",
                    "description": "ID del servicio a solicitar (UUID) - Obtener de obtener_servicios"
                },
                "estacion_id": {
                    "type": "string",
                    "description": "ID de la estación asignada (UUID) - Obtener de obtener_estaciones"
                },
                "fecha": {
                    "type": "string",
                    "description": "Fecha de la cita en formato YYYY-MM-DD - Obtener de ver_horarios_disponibles"
                },
                "hora_inicio": {
                    "type": "string",
                    "description": "Hora de inicio en formato HH:MM (24h) - Obtener de ver_horarios_disponibles"
                },
                "hora_fin": {
                    "type": "string",
                    "description": "Hora de fin en formato HH:MM (24h) - Obtener de ver_horarios_disponibles"
                }
            },
            "requeridos": ["cliente_id", "negocio_id", "servicio_id", "estacion_id", "fecha", "hora_inicio", "hora_fin"]
        },
        {
            "nombre": "cancelar_cita",
            "descripcion": "Cancela una cita existente. Cambia el estado de la cita a 'cancelada'.",
            "parametros": {
                "cita_id": {
                    "type": "string",
                    "description": "ID de la cita a cancelar (UUID)"
                },
                "motivo": {
                    "type": "string",
                    "description": "Motivo de la cancelación (opcional)"
                }
            },
            "requeridos": ["cita_id"]
        },
        {
            "nombre": "consultar_citas",
            "descripcion": "Consulta citas aplicando diferentes filtros. Permite buscar citas por cliente, negocio, estado y rango de fechas.",
            "parametros": {
                "cliente_id": {
                    "type": "string",
                    "description": "ID del cliente (UUID, opcional)"
                },
                "negocio_id": {
                    "type": "string",
                    "description": "ID del negocio (UUID, opcional)"
                },
                "estado": {
                    "type": "string",
                    "description": "Estado de la cita: pendiente, atendida o cancelada (opcional)",
                    "enum": ["pendiente", "atendida", "cancelada"]
                },
                "fecha_inicio": {
                    "type": "string",
                    "description": "Fecha de inicio del rango en formato YYYY-MM-DD (opcional)"
                },
                "fecha_fin": {
                    "type": "string",
                    "description": "Fecha de fin del rango en formato YYYY-MM-DD (opcional)"
                }
            },
            "requeridos": []
        },
        {
            "nombre": "buscar_negocios",
            "descripcion": "Busca negocios en el sistema. USA ESTA HERRAMIENTA SOLO UNA VEZ al inicio cuando el usuario pregunta por primera vez qué negocios hay disponibles. IMPORTANTE: Después de mostrar los resultados al usuario, NO VUELVAS A LLAMAR A ESTA HERRAMIENTA. Cuando el usuario elija un negocio (ejemplo: 'Quiero hacer una cita en Veterinaria San juan'), DEBES INMEDIATAMENTE llamar a 'obtener_servicios' usando el negocio_id que ya obtuviste.",
            "parametros": {
                "nombre": {
                    "type": "string",
                    "description": "Nombre o parte del nombre del negocio a buscar (opcional)"
                },
                "categoria": {
                    "type": "string",
                    "description": "Categoría del negocio (opcional)"
                },
                "activo": {
                    "type": "boolean",
                    "description": "Filtrar solo negocios activos (opcional)"
                }
            },
            "requeridos": []
        },
        {
            "nombre": "obtener_servicios",
            "descripcion": "LLAMAR AUTOMÁTICAMENTE cuando el usuario elige/menciona un negocio específico. Esta herramienta obtiene TODOS los servicios disponibles del negocio. FLUJO OBLIGATORIO: 1) Usuario dice 'Quiero cita en [NEGOCIO]' -> 2) INMEDIATAMENTE llama obtener_servicios con negocio_id -> 3) Muestra los servicios al usuario con sus precios -> 4) Usuario elige servicio -> 5) Llama obtener_estaciones. NO preguntes al usuario qué quiere antes de mostrar los servicios.",
            "parametros": {
                "negocio_id": {
                    "type": "string",
                    "description": "ID del negocio que el usuario ELIGIÓ. Este ID ya lo tienes del resultado de buscar_negocios (UUID)"
                }
            },
            "requeridos": ["negocio_id"]
        },
        {
            "nombre": "obtener_estaciones",
            "descripcion": "LLAMAR AUTOMÁTICAMENTE cuando el usuario elige/menciona un servicio específico. Obtiene las estaciones (puestos de trabajo) disponibles en el negocio. FLUJO: Usuario elige servicio -> Llamas obtener_estaciones -> Muestras estaciones -> Usuario elige estación -> Llamas ver_horarios_disponibles. Siempre muestra las estaciones al usuario para que elija.",
            "parametros": {
                "negocio_id": {
                    "type": "string",
                    "description": "ID del negocio previamente elegido (UUID)"
                }
            },
            "requeridos": ["negocio_id"]
        },
        {
            "nombre": "obtener_info_negocio",
            "descripcion": "Obtiene información completa de un negocio específico, incluyendo horarios, servicios y estaciones.",
            "parametros": {
                "negocio_id": {
                    "type": "string",
                    "description": "ID del negocio (UUID)"
                }
            },
            "requeridos": ["negocio_id"]
        }
    ]


__all__ = [
    "ver_horarios_disponibles",
    "crear_cita",
    "cancelar_cita",
    "consultar_citas",
    "buscar_negocios",
    "obtener_servicios",
    "obtener_estaciones",
    "obtener_info_negocio",
    "obtener_herramientas_disponibles",
    "obtener_definiciones_herramientas"
]
