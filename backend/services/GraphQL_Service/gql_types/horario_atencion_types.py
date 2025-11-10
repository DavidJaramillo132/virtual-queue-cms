import strawberry
from typing import Optional
from datetime import time, datetime

@strawberry.type
class HorarioAtencion:
    id: str
    estacion_id: str
    dia_semana: int
    hora_inicio: time
    hora_fin: time
    creado_en: datetime
