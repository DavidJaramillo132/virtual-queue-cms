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
    negocio_id: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    duracion_minutos: int = 0
    precio_centavos: int = 0
    creado_en: Optional[str] = None  # Datetime como string ISO

