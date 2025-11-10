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
    totalServicios: int
    totalCitas: int

@strawberry.type
class Negocio:
    id: str
    admin_negocio_id: Optional[str] = None
    nombre: str
    categoria: str
    descripcion: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None
    imagen_url: Optional[str] = None
    estado: bool
    horario_general: Optional[str] = None
    creado_en: datetime
