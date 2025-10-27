import strawberry
from typing import Optional
from datetime import datetime

@strawberry.type
class AdminSistema:
    id: str
    usuario_id: str
    permisos: str
    creado_en: datetime
