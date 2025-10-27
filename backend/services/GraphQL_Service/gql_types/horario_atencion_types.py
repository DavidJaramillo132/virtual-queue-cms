import strawberry
from typing import Optional
from datetime import time

@strawberry.type
class HorarioAtencion:
    id: str
    negocio_id: str
    dia_semana: int
    inicio: time
    fin: time
    activo: bool
