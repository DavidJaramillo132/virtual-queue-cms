import strawberry
from typing import List
from resolvers.usuarios_resolver import UsuariosResolver
from resolvers.citas_resolver import CitasResolver
from resolvers.servicios_resolver import ServiciosResolver
from resolvers.negocios_resolver import NegociosResolver
from resolvers.estaciones_resolver import EstacionesResolver
from resolvers.fila_resolver import FilaResolver
from resolvers.horarios_atencion_resolver import HorariosAtencionResolver
from resolvers.admin_sistema_resolver import AdminSistemaResolver

# Import all types
from types.usuario_types import Usuario, UsuarioCitasDTO, PerfilCompletoUsuario
from types.cita_types import Cita, MetricasTemporales
from types.servicio_types import Servicio, RankingServicios
from types.negocio_types import Negocio, DashboardNegocio, ResumenNegocio
from types.estacion_types import Estacion, EstacionDTO
from types.fila_types import Fila
from types.horario_atencion_types import HorarioAtencion
from types.admin_sistema_types import AdminSistema

@strawberry.type
class Query:
    # Usuarios queries
    @strawberry.field(description="Obtener todos los usuarios")
    async def usuarios(self) -> List[Usuario]:
        return await UsuariosResolver.find_all()
    
    @strawberry.field(description="Obtener un usuario por ID")
    async def usuario(self, id: str) -> Usuario:
        return await UsuariosResolver.find_one(id)
    
    @strawberry.field(description="Lista los usuarios con sus citas pendientes")
    async def usuarios_con_citas_pendientes(self) -> List[UsuarioCitasDTO]:
        return await UsuariosResolver.usuarios_con_citas_pendientes()
    
    @strawberry.field(description="Lista los usuarios con sus citas atendidas")
    async def usuarios_con_citas_atendidas(self) -> List[UsuarioCitasDTO]:
        return await UsuariosResolver.usuarios_con_citas_atendidas()
    
    @strawberry.field(description="Perfil completo del usuario")
    async def perfil_completo_usuario(self, usuario_id: str) -> PerfilCompletoUsuario:
        return await UsuariosResolver.perfil_completo_usuario(usuario_id)
    
    # Citas queries
    @strawberry.field(description="Obtener todas las citas")
    async def citas(self) -> List[Cita]:
        return await CitasResolver.find_all()
    
    @strawberry.field(description="Obtener una cita por ID")
    async def cita(self, id: str) -> Cita:
        return await CitasResolver.find_one(id)
    
    @strawberry.field(description="Métricas temporales de citas")
    async def metricas_temporales(self) -> MetricasTemporales:
        return await CitasResolver.metricas_temporales()
    
    # Servicios queries
    @strawberry.field(description="Obtener todos los servicios")
    async def servicios(self) -> List[Servicio]:
        return await ServiciosResolver.find_all()
    
    @strawberry.field(description="Obtener un servicio por ID")
    async def servicio(self, id: str) -> Servicio:
        return await ServiciosResolver.find_one(id)
    
    @strawberry.field(description="Ranking de servicios más solicitados")
    async def ranking_servicios(self) -> List[RankingServicios]:
        return await ServiciosResolver.ranking_servicios()
    
    # Negocios queries
    @strawberry.field(description="Obtener todos los negocios")
    async def negocios(self) -> List[Negocio]:
        return await NegociosResolver.find_all()
    
    @strawberry.field(description="Obtener un negocio por ID")
    async def negocio(self, id: str) -> Negocio:
        return await NegociosResolver.find_one(id)
    
    @strawberry.field(description="Dashboard del negocio")
    async def dashboard_negocio(self, negocio_id: str) -> DashboardNegocio:
        return await NegociosResolver.dashboard_negocio(negocio_id)
    
    @strawberry.field(description="Resumen del negocio")
    async def resumen_negocio(self, negocio_id: str) -> ResumenNegocio:
        return await NegociosResolver.resumen_negocio(negocio_id)
    
    # Estaciones queries
    @strawberry.field(description="Obtener todas las estaciones")
    async def estaciones(self) -> List[Estacion]:
        return await EstacionesResolver.find_all()
    
    @strawberry.field(description="Obtener una estación por ID")
    async def estacion(self, id: str) -> Estacion:
        return await EstacionesResolver.find_one(id)
    
    # Fila queries
    @strawberry.field(description="Obtener todas las filas")
    async def filas(self) -> List[Fila]:
        return await FilaResolver.find_all()
    
    @strawberry.field(description="Obtener una fila por ID")
    async def fila(self, id: str) -> Fila:
        return await FilaResolver.find_one(id)
    
    # Horarios queries
    @strawberry.field(description="Obtener todos los horarios de atención")
    async def horarios_atencion(self) -> List[HorarioAtencion]:
        return await HorariosAtencionResolver.find_all()
    
    @strawberry.field(description="Obtener un horario por ID")
    async def horario_atencion(self, id: str) -> HorarioAtencion:
        return await HorariosAtencionResolver.find_one(id)
    
    # Admin Sistema queries
    @strawberry.field(description="Obtener todos los administradores del sistema")
    async def admin_sistema(self) -> List[AdminSistema]:
        return await AdminSistemaResolver.find_all()

schema = strawberry.Schema(query=Query)
