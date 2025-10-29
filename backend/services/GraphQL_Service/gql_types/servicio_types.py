import strawberry
from typing import Optional
from datetime import datetime

@strawberry.type
class RankingServicios:
    servicio: str
    total_citas: int

@strawberry.type
class Servicio:
    id: str
    nombre: str | None = ""
    codigo: str | None = None
    descripcion: str | None = None
    duracion_minutos: int
    capacidad: int = 1
    requiere_cita: bool = True
    precio_centavos: int = 0
    visible: bool = True
    creadoEn: datetime | None = None
