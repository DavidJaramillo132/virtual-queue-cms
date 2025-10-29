from typing import List, Optional, Dict
from services.http_client import http_client
from gql_types.servicio_types import Servicio, RankingServicios


def _headers_from_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    return {"Authorization": token} if token else None


class ServiciosResolver:
    @staticmethod
    async def find_all(token: Optional[str] = None) -> List[Servicio]:
        """Get all services from REST API. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/servicios", headers=headers)
        return [Servicio(**servicio) for servicio in data]

    @staticmethod
    async def find_one(id: str, token: Optional[str] = None) -> Servicio:
        """Get a single service by ID. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get(f"/api/servicios/{id}", headers=headers)
        return Servicio(**data)

    @staticmethod
    async def ranking_servicios(token: Optional[str] = None) -> List[RankingServicios]:
        """Ranking of services"""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/servicios/ranking", headers=headers)
        return [RankingServicios(**r) for r in data]
