from typing import List, Optional, Dict
from services.http_client import http_client
from gql_types.horario_atencion_types import HorarioAtencion


def _headers_from_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    return {"Authorization": token} if token else None


class HorariosAtencionResolver:
    @staticmethod
    async def find_all(token: Optional[str] = None) -> List[HorarioAtencion]:
        """Get all business hours from REST API. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/horarios-atencion/", headers=headers)
        return [HorarioAtencion(**horario) for horario in data]

    @staticmethod
    async def find_one(id: str, token: Optional[str] = None) -> HorarioAtencion:
        """Get a single business hour by ID. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get(f"/api/horarios-atencion/{id}", headers=headers)
        return HorarioAtencion(**data)
