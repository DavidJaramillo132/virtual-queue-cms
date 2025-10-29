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
    admin_negocio_id: str | None = None
    nombre: str = ""
    categoria: str = ""
    descripcion: str | None = None
    telefono: str | None = None
    correo: str | None = None
    imagen_url: str | None = None
    estado: bool = True
    hora_atencion: str | None = None
    creadoEn: datetime | None = None
