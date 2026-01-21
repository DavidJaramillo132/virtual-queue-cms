import strawberry
from typing import Optional
from datetime import date, time, datetime
from enum import Enum

@strawberry.enum
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
    cliente_id: str
    negocio_id: str
    estacion_id: Optional[str] = None
    servicio_id: Optional[str] = None
    fecha: str  # Fecha como string ISO (YYYY-MM-DD)
    hora_inicio: str  # Hora como string (HH:MM:SS)
    hora_fin: str  # Hora como string (HH:MM:SS)
    estado: str  # Estado como string
    creadoEn: Optional[str] = None  # Datetime como string ISO
