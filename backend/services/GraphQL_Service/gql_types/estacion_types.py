import strawberry
from typing import Optional
from datetime import datetime
from enum import Enum

@strawberry.enum
class EstadoEstacion(Enum):
    ACTIVA = "activa"
    INACTIVA = "inactiva"

@strawberry.type
class EstacionDTO:
    id: str
    nombre: str
    estado: EstadoEstacion

@strawberry.type
class Estacion:
    id: str
    negocio_id: str
    nombre: str
    tipo: Optional[str] = None
    estado: EstadoEstacion
    creado_en: datetime
    solo_premium: bool = False

