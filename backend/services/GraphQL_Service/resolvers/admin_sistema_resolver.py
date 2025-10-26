from typing import List
from services.http_client import http_client
from types.admin_sistema_types import AdminSistema

class AdminSistemaResolver:
    @staticmethod
    async def find_all() -> List[AdminSistema]:
        """Get all system admins from REST API"""
        data = await http_client.get("/api/admin-sistema/")
        return [AdminSistema(**admin) for admin in data]
