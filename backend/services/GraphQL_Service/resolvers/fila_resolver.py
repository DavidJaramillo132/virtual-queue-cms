from typing import List
from services.http_client import http_client
from gql_types.fila_types import Fila

class FilaResolver:
    @staticmethod
    async def find_all() -> List[Fila]:
        """Get all queue entries from REST API"""
        data = await http_client.get("/api/filas/")
        return [Fila(**fila) for fila in data]
    
    @staticmethod
    async def find_one(id: str) -> Fila:
        """Get a single queue entry by ID"""
        data = await http_client.get(f"/api/filas/{id}")
        return Fila(**data)
