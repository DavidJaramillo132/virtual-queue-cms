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
    nombreCompleto: str
    email: str
    telefono: str
    totalCitas: int
    citasCompletadas: int
    citasPendientes: int
    citasCanceladas: int

@strawberry.type
class Usuario:
    id: str
    email: str
    password: str
    rol: Rol
    telefono: Optional[str] = None
    creadoEn: datetime
    nombreCompleto: str
