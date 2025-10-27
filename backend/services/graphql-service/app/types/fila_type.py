import strawberry
from typing import Optional, List
from datetime import datetime

@strawberry.enum
class EstadoFila(strawberry.enum.Enum):
    """
    Estados posibles de una fila
    """
    ABIERTA = "abierta"
    CERRADA = "cerrada"

@strawberry.type
class Fila:
    """
    Tipo GraphQL para Fila
    """
    id: str
    id_cliente: str
    date: datetime
    start_time: str
    state: EstadoFila
    cita_id: Optional[str]

@strawberry.type
class EstadisticasFila:
    """
    Estadísticas de una fila específica
    """
    id_fila: str
    total_citas: int
    citas_atendidas: int
    citas_pendientes: int
    citas_canceladas: int
    tiempo_promedio_espera: float  # en minutos
    personas_en_espera: int
    estado_actual: EstadoFila

@strawberry.type
class FilaConCitas:
    """
    Fila con información de sus citas
    """
    id: str
    date: datetime
    start_time: str
    state: EstadoFila
    total_citas: int
    citas_activas: int
