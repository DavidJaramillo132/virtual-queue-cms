import strawberry
from typing import Optional
from datetime import datetime
from types.enums import Estado

@strawberry.type
class MetricasTemporales:
    total_citas: int
    citas_hoy: int
    citas_semana: int
    citas_mes: int

@strawberry.type
class Cita:
    id: str
    usuario_id: str
    servicio_id: str
    negocio_id: str
    fecha: datetime
    estado: Estado
    notas: Optional[str] = None
    creado_en: datetime
