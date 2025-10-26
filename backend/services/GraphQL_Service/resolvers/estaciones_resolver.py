from typing import List
from services.http_client import http_client
from types.estacion_types import Estacion

class EstacionesResolver:
    @staticmethod
    async def find_all() -> List[Estacion]:
        """Get all stations from REST API"""
        data = await http_client.get("/api/estaciones/")
        return [Estacion(**estacion) for estacion in data]
    
    @staticmethod
    async def find_one(id: str) -> Estacion:
        """Get a single station by ID"""
        data = await http_client.get(f"/api/estaciones/{id}")
        return Estacion(**data)
