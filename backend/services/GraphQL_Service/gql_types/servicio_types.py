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
    negocio_id: str
    nombre: str
    descripcion: Optional[str] = None
    duracion_minutos: int
    precio_centavos: int
    creado_en: datetime

