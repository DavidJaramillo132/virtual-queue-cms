from typing import List, Optional, Dict
from services.http_client import http_client
from gql_types.negocio_types import Negocio, DashboardNegocio, ResumenNegocio
from gql_types.enums import Estado


def _headers_from_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    return {"Authorization": token} if token else None

class NegociosResolver:
    @staticmethod
    async def find_all(token: Optional[str] = None) -> List[Negocio]:
        """Get all businesses from REST API. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/negocios/", headers=headers)
        return [Negocio(**negocio) for negocio in data]
    
    @staticmethod
    async def find_one(id: str, token: Optional[str] = None) -> Negocio:
        """Get a single business by ID. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get(f"/api/negocios/{id}", headers=headers)
        return Negocio(**data)
    
    @staticmethod
    async def dashboard_negocio(negocio_id: str, token: Optional[str] = None) -> DashboardNegocio:
        """Get business dashboard with metrics"""
        from resolvers.servicios_resolver import ServiciosResolver
        from resolvers.citas_resolver import CitasResolver

        negocio = await NegociosResolver.find_one(negocio_id, token)
        servicios = await ServiciosResolver.find_all(token)
        citas = await CitasResolver.find_all(token)
        
        servicios_negocio = [s for s in servicios if s.negocio_id == negocio_id]
        citas_negocio = [c for c in citas if c.negocio_id == negocio_id]
        
        citas_pendientes = len([c for c in citas_negocio if c.estado == Estado.PENDIENTE])
        citas_atendidas = len([c for c in citas_negocio if c.estado == Estado.ATENDIDA])
        
        return DashboardNegocio(
            nombre_negocio=negocio.nombre,
            total_servicios=len(servicios_negocio),
            total_citas=len(citas_negocio),
            citas_pendientes=citas_pendientes,
            citas_atendidas=citas_atendidas
        )
    
    @staticmethod
    async def resumen_negocio(negocio_id: str, token: Optional[str] = None) -> ResumenNegocio:
        """Get business summary"""
        from resolvers.servicios_resolver import ServiciosResolver
        from resolvers.citas_resolver import CitasResolver

        negocio = await NegociosResolver.find_one(negocio_id, token)
        servicios = await ServiciosResolver.find_all(token)
        citas = await CitasResolver.find_all(token)
        
        servicios_negocio = [s for s in servicios if s.negocio_id == negocio_id]
        citas_negocio = [c for c in citas if c.negocio_id == negocio_id]
        
        return ResumenNegocio(
            id=negocio.id,
            nombre=negocio.nombre,
            direccion=negocio.direccion,
            total_servicios=len(servicios_negocio),
            total_citas=len(citas_negocio)
        )
