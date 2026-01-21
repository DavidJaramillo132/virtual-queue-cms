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
        today_str = now.strftime('%Y-%m-%d')
        week_start = (now - timedelta(days=now.weekday())).strftime('%Y-%m-%d')
        month_start = now.replace(day=1).strftime('%Y-%m-%d')
        tomorrow_str = (now + timedelta(days=1)).strftime('%Y-%m-%d')
        
        total_citas = len(citas)
        # Comparar fechas como strings ISO (funciona porque YYYY-MM-DD es ordenable)
        citas_hoy = len([c for c in citas if c.fecha >= today_str and c.fecha < tomorrow_str])
        citas_semana = len([c for c in citas if c.fecha >= week_start])
        citas_mes = len([c for c in citas if c.fecha >= month_start])
        
        return MetricasTemporales(
            total_citas=total_citas,
            citas_hoy=citas_hoy,
            citas_semana=citas_semana,
            citas_mes=citas_mes
        )
