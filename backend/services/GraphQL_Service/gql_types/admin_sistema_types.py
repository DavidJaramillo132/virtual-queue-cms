import strawberry
from typing import Optional

@strawberry.type
class AdminSistema:
    id: str
    usuario_id: str
    nombre: str
    apellidos: str
    telefono: Optional[str] = None
