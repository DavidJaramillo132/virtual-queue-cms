from enum import Enum
import strawberry

@strawberry.enum
class Rol(Enum):
    CLIENTE = "cliente"
    NEGOCIO = "negocio"
    ADMIN_SISTEMA = "admin_sistema"

@strawberry.enum
class EstadoCita(Enum):
    PENDIENTE = "pendiente"
    ATENDIDA = "atendida"
    CANCELADA = "cancelada"

@strawberry.enum
class EstadoEstacion(Enum):
    ACTIVA = "activa"
    INACTIVA = "inactiva"
