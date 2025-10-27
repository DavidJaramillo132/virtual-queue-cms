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
    nombre: str
    descripcion: Optional[str] = None
    duracion: int
    precio: float
    negocio_id: str
    creado_en: datetime
