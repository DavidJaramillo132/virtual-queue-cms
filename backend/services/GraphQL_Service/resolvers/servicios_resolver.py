from typing import List
from services.http_client import http_client
from types.servicio_types import Servicio, RankingServicios

class ServiciosResolver:
    @staticmethod
    async def find_all() -> List[Servicio]:
        """Get all services from REST API"""
        data = await http_client.get("/api/servicios/")
        return [Servicio(**servicio) for servicio in data]
    
    @staticmethod
    async def find_one(id: str) -> Servicio:
        """Get a single service by ID"""
        data = await http_client.get(f"/api/servicios/{id}")
        return Servicio(**data)
    
    @staticmethod
    async def ranking_servicios() -> List[RankingServicios]:
        """Get ranking of most requested services"""
        from resolvers.citas_resolver import CitasResolver
        
        servicios = await ServiciosResolver.find_all()
        citas = await CitasResolver.find_all()
        
        # Count appointments per service
        servicio_counts = {}
        for cita in citas:
            servicio_counts[cita.servicio_id] = servicio_counts.get(cita.servicio_id, 0) + 1
        
        # Create ranking
        ranking = []
        for servicio in servicios:
            count = servicio_counts.get(servicio.id, 0)
            ranking.append(RankingServicios(
                servicio=servicio.nombre,
                total_citas=count
            ))
        
        # Sort by total_citas descending
        ranking.sort(key=lambda x: x.total_citas, reverse=True)
        
        return ranking
