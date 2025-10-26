from typing import List
from services.http_client import http_client
from types.negocio_types import Negocio, DashboardNegocio, ResumenNegocio
from types.enums import Estado

class NegociosResolver:
    @staticmethod
    async def find_all() -> List[Negocio]:
        """Get all businesses from REST API"""
        data = await http_client.get("/api/negocios/")
        return [Negocio(**negocio) for negocio in data]
    
    @staticmethod
    async def find_one(id: str) -> Negocio:
        """Get a single business by ID"""
        data = await http_client.get(f"/api/negocios/{id}")
        return Negocio(**data)
    
    @staticmethod
    async def dashboard_negocio(negocio_id: str) -> DashboardNegocio:
        """Get business dashboard with metrics"""
        from resolvers.servicios_resolver import ServiciosResolver
        from resolvers.citas_resolver import CitasResolver
        
        negocio = await NegociosResolver.find_one(negocio_id)
        servicios = await ServiciosResolver.find_all()
        citas = await CitasResolver.find_all()
        
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
    async def resumen_negocio(negocio_id: str) -> ResumenNegocio:
        """Get business summary"""
        from resolvers.servicios_resolver import ServiciosResolver
        from resolvers.citas_resolver import CitasResolver
        
        negocio = await NegociosResolver.find_one(negocio_id)
        servicios = await ServiciosResolver.find_all()
        citas = await CitasResolver.find_all()
        
        servicios_negocio = [s for s in servicios if s.negocio_id == negocio_id]
        citas_negocio = [c for c in citas if c.negocio_id == negocio_id]
        
        return ResumenNegocio(
            id=negocio.id,
            nombre=negocio.nombre,
            direccion=negocio.direccion,
            total_servicios=len(servicios_negocio),
            total_citas=len(citas_negocio)
        )
