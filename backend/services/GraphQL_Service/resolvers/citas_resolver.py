from typing import List, Optional, Dict
from services.http_client import http_client
from gql_types.cita_types import Cita, MetricasTemporales
from datetime import datetime, timedelta


def _headers_from_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    return {"Authorization": token} if token else None

class CitasResolver:
    @staticmethod
    async def find_all(token: Optional[str] = None) -> List[Cita]:
        """Get all appointments from REST API. If token is provided, it will be forwarded as Authorization header."""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/citas/", headers=headers)
        return [Cita(**cita) for cita in data]
    
    @staticmethod
    async def find_one(id: str, token: Optional[str] = None) -> Cita:
        """Get a single appointment by ID. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get(f"/api/citas/{id}", headers=headers)
        return Cita(**data)
    
    @staticmethod
    async def metricas_temporales(token: Optional[str] = None) -> MetricasTemporales:
        """Get temporal metrics for appointments"""
        citas = await CitasResolver.find_all(token)
        
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)
        
        total_citas = len(citas)
        citas_hoy = len([c for c in citas if c.fecha >= today_start and c.fecha < today_start + timedelta(days=1)])
        citas_semana = len([c for c in citas if c.fecha >= week_start])
        citas_mes = len([c for c in citas if c.fecha >= month_start])
        
        return MetricasTemporales(
            total_citas=total_citas,
            citas_hoy=citas_hoy,
            citas_semana=citas_semana,
            citas_mes=citas_mes
        )
