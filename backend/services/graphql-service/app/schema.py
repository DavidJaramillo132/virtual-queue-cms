import strawberry
from typing import List, Optional
from app.queries.negocio_queries import get_negocios, get_negocio_by_id
from app.queries.fila_queries import get_filas_activas, get_estadisticas_fila
from app.queries.cita_queries import get_citas_por_cliente, get_citas_por_negocio
from app.queries.reportes_queries import get_reporte_general, get_reporte_por_negocio
from app.types.negocio_type import Negocio
from app.types.fila_type import Fila, EstadisticasFila
from app.types.cita_type import Cita
from app.types.reportes_type import ReporteGeneral, ReporteNegocio

@strawberry.type
class Query:
    # Consultas de Negocios
    negocios: List[Negocio] = strawberry.field(resolver=get_negocios)
    negocio: Optional[Negocio] = strawberry.field(resolver=get_negocio_by_id)
    
    # Consultas de Filas
    filas_activas: List[Fila] = strawberry.field(resolver=get_filas_activas)
    estadisticas_fila: Optional[EstadisticasFila] = strawberry.field(
        resolver=get_estadisticas_fila
    )
    
    # Consultas de Citas
    citas_cliente: List[Cita] = strawberry.field(resolver=get_citas_por_cliente)
    citas_negocio: List[Cita] = strawberry.field(resolver=get_citas_por_negocio)
    
    # Reportes Complejos
    reporte_general: ReporteGeneral = strawberry.field(resolver=get_reporte_general)
    reporte_negocio: ReporteNegocio = strawberry.field(
        resolver=get_reporte_por_negocio
    )

schema = strawberry.Schema(query=Query)