from typing import List, Optional, Dict
from services.http_client import http_client
from gql_types.admin_sistema_types import AdminSistema


def _headers_from_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    return {"Authorization": token} if token else None


class AdminSistemaResolver:
    @staticmethod
    async def find_all(token: Optional[str] = None) -> List[AdminSistema]:
        """Get all system admins from REST API. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/admins/", headers=headers)
        return [AdminSistema(**admin) for admin in data]
