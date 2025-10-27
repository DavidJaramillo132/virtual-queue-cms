import strawberry
from typing import Optional
from datetime import datetime

@strawberry.type
class DashboardNegocio:
    nombre_negocio: str
    total_servicios: int
    total_citas: int
    citas_pendientes: int
    citas_atendidas: int

@strawberry.type
class ResumenNegocio:
    id: str
    nombre: str
    direccion: str
    total_servicios: int
    total_citas: int

@strawberry.type
class Negocio:
    id: str
    nombre: str
    descripcion: Optional[str] = None
    direccion: str
    telefono: Optional[str] = None
    admin_id: str
    creado_en: datetime
