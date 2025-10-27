import strawberry
from typing import Optional, List
from datetime import datetime

@strawberry.type
class Negocio:
    """
    Tipo GraphQL para Negocio
    """
    id: str
    nombre: str
    categoria: str
    descripcion: Optional[str]
    ubicacion: str
    telefono: Optional[str]
    correo: Optional[str]
    imagen_url: Optional[str]
    estado: bool
    hora_de_atencion: str

@strawberry.type
class EstadisticasNegocio:
    """
    Estadísticas completas de un negocio
    """
    negocio_id: str
    nombre: str
    total_citas: int
    citas_atendidas: int
    citas_pendientes: int
    citas_canceladas: int
    tiempo_promedio_atencion: float
    clientes_unicos: int
    servicios_activos: int
    ingresos_totales: float
    calificacion_promedio: Optional[float]
