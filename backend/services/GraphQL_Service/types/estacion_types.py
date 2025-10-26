import strawberry
from typing import Optional
from datetime import datetime
from types.enums import EstadoEstacion

@strawberry.type
class EstacionDTO:
    id: str
    nombre: str
    estado: EstadoEstacion
    negocio: str

@strawberry.type
class Estacion:
    id: str
    nombre: str
    descripcion: Optional[str] = None
    estado: EstadoEstacion
    negocio_id: str
    creado_en: datetime
