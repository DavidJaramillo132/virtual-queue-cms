from typing import List, Optional, Dict
from services.http_client import http_client
from gql_types.estacion_types import Estacion


def _headers_from_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    return {"Authorization": token} if token else None


class EstacionesResolver:
    @staticmethod
    def _normalize_estacion_data(estacion_data: dict) -> dict:
        """Normaliza los datos de la estación del formato REST API al formato GraphQL"""
        normalized = estacion_data.copy()
        # Normalizar creadoEn a creado_en
        if 'creadoEn' in normalized and 'creado_en' not in normalized:
            normalized['creado_en'] = normalized.pop('creadoEn')
        return normalized
    
    @staticmethod
    async def find_all(token: Optional[str] = None) -> List[Estacion]:
        """Get all stations from REST API. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/estaciones/", headers=headers)
        return [Estacion(**EstacionesResolver._normalize_estacion_data(estacion)) for estacion in data]

    @staticmethod
    async def find_one(id: str, token: Optional[str] = None) -> Estacion:
        """Get a single station by ID. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get(f"/api/estaciones/{id}", headers=headers)
        return Estacion(**EstacionesResolver._normalize_estacion_data(data))
