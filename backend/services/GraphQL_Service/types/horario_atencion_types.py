import strawberry
from typing import Optional
from datetime import time

@strawberry.type
class HorarioAtencion:
    id: str
    negocio_id: str
    dia_semana: str
    hora_inicio: str
    hora_fin: str
    activo: bool
