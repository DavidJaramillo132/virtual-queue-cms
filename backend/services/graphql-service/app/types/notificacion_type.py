import strawberry
from typing import Optional
from datetime import datetime

@strawberry.enum
class TipoNotificacion(strawberry.enum.Enum):
    """
    Tipos de notificaciones
    """
    CITA_CONFIRMADA = "cita_confirmada"
    CITA_RECORDATORIO = "cita_recordatorio"
    CITA_CANCELADA = "cita_cancelada"
    FILA_ACTUALIZADA = "fila_actualizada"

@strawberry.enum
class EstadoNotificacion(strawberry.enum.Enum):
    """
    Estados de notificación
    """
    PENDIENTE = "pendiente"
    ENVIADA = "enviada"
    FALLIDA = "fallida"

@strawberry.type
class Notificacion:
    """
    Tipo GraphQL para Notificación
    """
    id: str
    id_cliente: str
    cita_id: Optional[str]
    negocio_id: Optional[str]
    tipo: TipoNotificacion
    contenido: str
    enviada_en: Optional[datetime]
    estado: EstadoNotificacion

@strawberry.type
class NotificacionResumen:
    """
    Resumen de notificaciones
    """
    total_enviadas: int
    total_pendientes: int
    total_fallidas: int
    ultima_notificacion: Optional[datetime]
