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
    estacion_id: str
    servicio_id: str
    fecha: date
    hora_inicio: time
    hora_fin: time
    estado: EstadoCita
    creadoEn: datetime
