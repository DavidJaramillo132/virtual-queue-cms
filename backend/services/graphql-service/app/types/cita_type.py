import strawberry
from typing import Optional
from datetime import datetime

@strawberry.enum
class EstadoCita(strawberry.enum.Enum):
    """
    Estados posibles de una cita
    """
    PENDIENTE = "pendiente"
    ATENDIDA = "atendida"
    CANCELADA = "cancelada"

@strawberry.type
class Cita:
    """
    Tipo GraphQL para Cita
    """
    id: str
    id_cliente: str
    hora_cita: datetime
    estado: EstadoCita
    servicio_id: str

@strawberry.type
class CitaDetallada(Cita):
    """
    Cita con información relacionada
    """
    cliente_nombre: str
    cliente_email: str
    servicio_nombre: str
    negocio_nombre: str
    duracion_minutos: Optional[int]

@strawberry.input
class CitaFiltro:
    """
    Filtros para buscar citas
    """
    id_cliente: Optional[str] = None
    id_negocio: Optional[str] = None
    estado: Optional[EstadoCita] = None
    fecha_desde: Optional[datetime] = None
    fecha_hasta: Optional[datetime] = None
