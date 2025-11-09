import strawberry
from typing import List, Optional
from strawberry.types import Info
from resolvers.usuarios_resolver import UsuariosResolver
from resolvers.citas_resolver import CitasResolver
from resolvers.servicios_resolver import ServiciosResolver
from resolvers.negocios_resolver import NegociosResolver
from resolvers.estaciones_resolver import EstacionesResolver
from resolvers.horarios_atencion_resolver import HorariosAtencionResolver
from resolvers.admin_sistema_resolver import AdminSistemaResolver
from resolvers.pdf_resolver import PdfResolver

# Import all types (use gql_types to avoid naming conflict with Python stdlib 'types')
from gql_types.usuario_types import Usuario, UsuarioCitasDTO, PerfilCompletoUsuario
from gql_types.cita_types import Cita, MetricasTemporales
from gql_types.servicio_types import Servicio, RankingServicios
from gql_types.negocio_types import Negocio, DashboardNegocio, ResumenNegocio
from gql_types.estacion_types import Estacion, EstacionDTO
from gql_types.horario_atencion_types import HorarioAtencion
from gql_types.admin_sistema_types import AdminSistema
from gql_types.pdf_types import InformePDF

@strawberry.type
class Query:
    # Usuarios queries
    @strawberry.field(description="Obtener todos los usuarios")
    async def usuarios(self, info: Info) -> List[Usuario]:
        token = info.context["request"].headers.get("authorization")
        return await UsuariosResolver.find_all(token)
    
    @strawberry.field(description="Obtener un usuario por ID")
    async def usuario(self, info: Info, id: str) -> Usuario:
        token = info.context["request"].headers.get("authorization")
        return await UsuariosResolver.find_one(id, token)
    
    @strawberry.field(description="Lista los usuarios con sus citas pendientes")
    async def usuarios_con_citas_pendientes(self, info: Info) -> List[UsuarioCitasDTO]:
        token = info.context["request"].headers.get("authorization")
        return await UsuariosResolver.usuarios_con_citas_pendientes(token)
    
    @strawberry.field(description="Lista los usuarios con sus citas atendidas")
    async def usuarios_con_citas_atendidas(self, info: Info) -> List[UsuarioCitasDTO]:
        token = info.context["request"].headers.get("authorization")
        return await UsuariosResolver.usuarios_con_citas_atendidas(token)
    
    @strawberry.field(description="Perfil completo del usuario")
    async def perfil_completo_usuario(self, info: Info) -> PerfilCompletoUsuario:
        # This resolver needs access to request headers, so forward the info
        return await UsuariosResolver.perfil_completo_usuario(info)
    
    # Citas queries
    @strawberry.field(description="Obtener todas las citas")
    async def citas(self, info: Info) -> List[Cita]:
        token = info.context["request"].headers.get("authorization")
        return await CitasResolver.find_all(token)
    
    @strawberry.field(description="Obtener una cita por ID")
    async def cita(self, info: Info, id: str) -> Cita:
        token = info.context["request"].headers.get("authorization")
        return await CitasResolver.find_one(id, token)
    
    @strawberry.field(description="Métricas temporales de citas")
    async def metricas_temporales(self, info: Info) -> MetricasTemporales:
        token = info.context["request"].headers.get("authorization")
        return await CitasResolver.metricas_temporales(token)
    
    # Servicios queries
    @strawberry.field(description="Obtener todos los servicios")
    async def servicios(self, info: Info) -> List[Servicio]:
        token = info.context["request"].headers.get("authorization")
        return await ServiciosResolver.find_all(token)
    
    @strawberry.field(description="Obtener un servicio por ID")
    async def servicio(self, info: Info, id: str) -> Servicio:
        token = info.context["request"].headers.get("authorization")
        return await ServiciosResolver.find_one(id, token)
    
    @strawberry.field(description="Ranking de servicios más solicitados")
    async def ranking_servicios(self, info: Info) -> List[RankingServicios]:
        token = info.context["request"].headers.get("authorization")
        return await ServiciosResolver.ranking_servicios(token)
    
    # Negocios queries
    @strawberry.field(description="Obtener todos los negocios")
    async def negocios(self, info: Info) -> List[Negocio]:
        token = info.context["request"].headers.get("authorization")
        return await NegociosResolver.find_all(token)
    
    @strawberry.field(description="Obtener un negocio por ID")
    async def negocio(self, info: Info, id: str) -> Negocio:
        token = info.context["request"].headers.get("authorization")
        return await NegociosResolver.find_one(id, token)
    
    @strawberry.field(description="Dashboard del negocio")
    async def dashboard_negocio(self, info: Info, negocio_id: str) -> DashboardNegocio:
        token = info.context["request"].headers.get("authorization")
        return await NegociosResolver.dashboard_negocio(negocio_id, token)
    
    @strawberry.field(description="Resumen del negocio")
    async def resumen_negocio(self, info: Info, negocio_id: str) -> ResumenNegocio:
        token = info.context["request"].headers.get("authorization")
        return await NegociosResolver.resumen_negocio(negocio_id, token)
    
    # Estaciones queries
    @strawberry.field(description="Obtener todas las estaciones")
    async def estaciones(self, info: Info) -> List[Estacion]:
        token = info.context["request"].headers.get("authorization")
        return await EstacionesResolver.find_all(token)
    
    @strawberry.field(description="Obtener una estación por ID")
    async def estacion(self, info: Info, id: str) -> Estacion:
        token = info.context["request"].headers.get("authorization")
        return await EstacionesResolver.find_one(id, token)
    

    # Horarios queries
    @strawberry.field(description="Obtener todos los horarios de atención")
    async def horarios_atencion(self, info: Info) -> List[HorarioAtencion]:
        token = info.context["request"].headers.get("authorization")
        return await HorariosAtencionResolver.find_all(token)
    
    @strawberry.field(description="Obtener un horario por ID")
    async def horario_atencion(self, info: Info, id: str) -> HorarioAtencion:
        token = info.context["request"].headers.get("authorization")
        return await HorariosAtencionResolver.find_one(id, token)
    
    # Admin Sistema queries
    @strawberry.field(description="Obtener todos los administradores del sistema")
    async def admin_sistema(self, info: Info) -> List[AdminSistema]:
        token = info.context["request"].headers.get("authorization")
        return await AdminSistemaResolver.find_all(token)
    
    # PDF queries
    @strawberry.field(description="Generar informe PDF del perfil del usuario autenticado")
    async def generar_informe_pdf(self, info: Info) -> InformePDF:
        return await PdfResolver.generar_informe_usuario(info)

schema = strawberry.Schema(query=Query)
