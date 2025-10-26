from enum import Enum
import strawberry

@strawberry.enum
class Rol(Enum):
    USUARIO = "USUARIO"
    ADMIN_NEGOCIO = "ADMIN_NEGOCIO"
    ADMIN_SISTEMA = "ADMIN_SISTEMA"

@strawberry.enum
class Estado(Enum):
    PENDIENTE = "PENDIENTE"
    ATENDIDA = "ATENDIDA"
    CANCELADA = "CANCELADA"

@strawberry.enum
class EstadoEstacion(Enum):
    DISPONIBLE = "DISPONIBLE"
    OCUPADA = "OCUPADA"
    MANTENIMIENTO = "MANTENIMIENTO"

@strawberry.enum
class EstadoFila(Enum):
    ESPERANDO = "ESPERANDO"
    EN_ATENCION = "EN_ATENCION"
    ATENDIDO = "ATENDIDO"
    CANCELADO = "CANCELADO"
