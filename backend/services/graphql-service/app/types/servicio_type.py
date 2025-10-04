import strawberry
from typing import Optional

@strawberry.type
class Servicio:
    """
    Tipo GraphQL para Servicio
    """
    id: str
    negocio_id: str
    cita_id: str
    nombre: str
    codigo: Optional[str]
    descripcion: Optional[str]
    duracion_minutos: int
    capacidad: Optional[int]
    requiere_cita: bool
    precio_centavos: Optional[int]
    visible: bool

@strawberry.type
class ServicioConEstadisticas:
    """
    Servicio con estadísticas de uso
    """
    id: str
    nombre: str
    descripcion: Optional[str]
    duracion_minutos: int
    precio_centavos: Optional[int]
    total_citas: int
    citas_completadas: int
    ingresos_totales: float
    promedio_calificacion: Optional[float]
