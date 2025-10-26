import strawberry
from typing import Optional
from datetime import datetime
from types.enums import EstadoFila

@strawberry.type
class Fila:
    id: str
    usuario_id: str
    servicio_id: str
    estacion_id: str
    posicion: int
    estado: EstadoFila
    hora_llegada: datetime
    hora_atencion: Optional[datetime] = None
