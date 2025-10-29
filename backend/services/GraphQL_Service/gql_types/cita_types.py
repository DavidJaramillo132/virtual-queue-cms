from matplotlib.pylab import Enum
import strawberry
from typing import Optional
from datetime import date, datetime
from gql_types.enums import Estado

class EstadoCita(Enum):
    PENDIENTE = "pendiente"
    ATENDIDA = "atendida"
    CANCELADA = "cancelada"


@strawberry.type
class MetricasTemporales:
    total_citas: int
    citas_hoy: int
    citas_semana: int
    citas_mes: int

@strawberry.type
class Cita:
    id: str
    usuario_id: str | None = None
    servicio_id: str | None = None
    fecha: date
    hora_inicio: str
    hora_fin: str
    estado: EstadoCita = EstadoCita.PENDIENTE
    creado_en: datetime | None = None
