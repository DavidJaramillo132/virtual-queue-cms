import strawberry
from typing import List, Optional
from datetime import datetime
from gql_types.enums import Rol

@strawberry.type
class CitaInfo:
    fecha: datetime
    servicio: Optional[str] = None

@strawberry.type
class UsuarioCitasDTO:
    usuario: str
    citas: List[CitaInfo]

@strawberry.type
class PerfilCompletoUsuario:
    id: str
    nombre: str
    email: str
    telefono: str
    total_citas: int
    citas_completadas: int
    citas_pendientes: int
    citas_canceladas: int

@strawberry.type
class Usuario:
    id: str
    email: str
    password: str
    rol: Rol
    telefono: Optional[str] = None
    creado_en: datetime
    nombre_completo: str
