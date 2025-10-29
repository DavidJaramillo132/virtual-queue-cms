from typing import List, Optional, Dict
from services.http_client import http_client
from gql_types.fila_types import Fila


def _headers_from_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    return {"Authorization": token} if token else None


class FilaResolver:
    @staticmethod
    async def find_all(token: Optional[str] = None) -> List[Fila]:
        """Get all queue entries from REST API. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/fila/", headers=headers)
        return [Fila(**fila) for fila in data]

    @staticmethod
    async def find_one(id: str, token: Optional[str] = None) -> Fila:
        """Get a single queue entry by ID. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get(f"/api/fila/{id}", headers=headers)
        return Fila(**data)
