import strawberry
from typing import Optional
from datetime import datetime

@strawberry.type
class Cliente:
    """
    Tipo GraphQL para Cliente
    """
    id: str
    name: str
    apellido: str
    email: str
    telefono: Optional[str]
    # password no se expone en GraphQL por seguridad
    rol: str  # 'cliente' o 'adminNegocio'

@strawberry.type
class ClienteDetallado(Cliente):
    """
    Cliente con información adicional para reportes
    """
    total_citas: int
    citas_completadas: int
    citas_canceladas: int
    ultima_cita: Optional[datetime]

@strawberry.input
class ClienteFiltro:
    """
    Filtros para buscar clientes
    """
    email: Optional[str] = None
    rol: Optional[str] = None
    nombre: Optional[str] = None
