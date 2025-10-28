from typing import List
from services.http_client import http_client
from gql_types.horario_atencion_types import HorarioAtencion

class HorariosAtencionResolver:
    @staticmethod
    async def find_all() -> List[HorarioAtencion]:
        """Get all business hours from REST API"""
        data = await http_client.get("/api/horarios/")
        return [HorarioAtencion(**horario) for horario in data]
    
    @staticmethod
    async def find_one(id: str) -> HorarioAtencion:
        """Get a single business hour by ID"""
        data = await http_client.get(f"/api/horarios/{id}")
        return HorarioAtencion(**data)
