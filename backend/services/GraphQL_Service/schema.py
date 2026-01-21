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


def get_auth_token(info: Info) -> Optional[str]:
    """Helper para obtener el token de Authorization de manera consistente"""
    # Primero intentar desde el contexto directo
    token = info.context.get("auth_header")
    if token:
        return token
    
    # Fallback: obtener del request (case-insensitive)
    request = info.context.get("request")
    if request:
        return (
            request.headers.get("authorization") or 
            request.headers.get("Authorization") or
            request.headers.get("AUTHORIZATION")
        )
    return None


@strawberry.type
class Query:
    # Usuarios queries
    @strawberry.field(description="Obtener todos los usuarios")
    async def usuarios(self, info: Info) -> List[Usuario]:
        token = get_auth_token(info)
        return await UsuariosResolver.find_all(token)
    
    @strawberry.field(description="Obtener un usuario por ID")
    async def usuario(self, info: Info, id: str) -> Usuario:
        token = get_auth_token(info)
        return await UsuariosResolver.find_one(id, token)
    
    @strawberry.field(description="Lista los usuarios con sus citas pendientes")
    async def usuarios_con_citas_pendientes(self, info: Info) -> List[UsuarioCitasDTO]:
        token = get_auth_token(info)
        return await UsuariosResolver.usuarios_con_citas_pendientes(token)
    
    @strawberry.field(description="Lista los usuarios con sus citas atendidas")
    async def usuarios_con_citas_atendidas(self, info: Info) -> List[UsuarioCitasDTO]:
        token = get_auth_token(info)
        return await UsuariosResolver.usuarios_con_citas_atendidas(token)
    
    @strawberry.field(description="Perfil completo del usuario")
    async def perfil_completo_usuario(self, info: Info) -> PerfilCompletoUsuario:
        # This resolver needs access to request headers, so forward the info
        return await UsuariosResolver.perfil_completo_usuario(info)
    
    # Citas queries
    @strawberry.field(description="Obtener todas las citas")
    async def citas(self, info: Info) -> List[Cita]:
        token = get_auth_token(info)
        return await CitasResolver.find_all(token)
    
    @strawberry.field(description="Obtener una cita por ID")
    async def cita(self, info: Info, id: str) -> Cita:
        token = get_auth_token(info)
        return await CitasResolver.find_one(id, token)
    
    @strawberry.field(description="Métricas temporales de citas")
    async def metricas_temporales(self, info: Info) -> MetricasTemporales:
        token = get_auth_token(info)
        return await CitasResolver.metricas_temporales(token)
    
    # Servicios queries
    @strawberry.field(description="Obtener todos los servicios")
    async def servicios(self, info: Info) -> List[Servicio]:
        token = get_auth_token(info)
        return await ServiciosResolver.find_all(token)
    
    @strawberry.field(description="Obtener un servicio por ID")
    async def servicio(self, info: Info, id: str) -> Servicio:
        token = get_auth_token(info)
        return await ServiciosResolver.find_one(id, token)
    
    @strawberry.field(description="Ranking de servicios más solicitados")
    async def ranking_servicios(self, info: Info) -> List[RankingServicios]:
        token = get_auth_token(info)
        return await ServiciosResolver.ranking_servicios(token)
    
    # Negocios queries
    @strawberry.field(description="Obtener todos los negocios")
    async def negocios(self, info: Info) -> List[Negocio]:
        token = get_auth_token(info)
        return await NegociosResolver.find_all(token)
    
    @strawberry.field(description="Obtener un negocio por ID")
    async def negocio(self, info: Info, id: str) -> Negocio:
        token = get_auth_token(info)
        return await NegociosResolver.find_one(id, token)
    
    @strawberry.field(description="Dashboard del negocio")
    async def dashboard_negocio(self, info: Info, negocio_id: str) -> DashboardNegocio:
        token = get_auth_token(info)
        return await NegociosResolver.dashboard_negocio(negocio_id, token)
    
    @strawberry.field(description="Resumen del negocio")
    async def resumen_negocio(self, info: Info, negocio_id: str) -> ResumenNegocio:
        token = get_auth_token(info)
        return await NegociosResolver.resumen_negocio(negocio_id, token)
    
    # Estaciones queries
    @strawberry.field(description="Obtener todas las estaciones")
    async def estaciones(self, info: Info) -> List[Estacion]:
        token = get_auth_token(info)
        return await EstacionesResolver.find_all(token)
    
    @strawberry.field(description="Obtener una estación por ID")
    async def estacion(self, info: Info, id: str) -> Estacion:
        token = get_auth_token(info)
        return await EstacionesResolver.find_one(id, token)
    

    # Horarios queries
    @strawberry.field(description="Obtener todos los horarios de atención")
    async def horarios_atencion(self, info: Info) -> List[HorarioAtencion]:
        token = get_auth_token(info)
        return await HorariosAtencionResolver.find_all(token)
    
    @strawberry.field(description="Obtener un horario por ID")
    async def horario_atencion(self, info: Info, id: str) -> HorarioAtencion:
        token = get_auth_token(info)
        return await HorariosAtencionResolver.find_one(id, token)
    
    # Admin Sistema queries
    @strawberry.field(description="Obtener todos los administradores del sistema")
    async def admin_sistema(self, info: Info) -> List[AdminSistema]:
        token = get_auth_token(info)
        return await AdminSistemaResolver.find_all(token)
    
    # PDF queries
    @strawberry.field(description="Generar informe PDF del perfil del usuario autenticado")
    async def generar_informe_pdf(self, info: Info) -> InformePDF:
        return await PdfResolver.generar_informe_usuario(info)
    
    @strawberry.field(description="Generar informe PDF de servicios más solicitados del negocio del usuario autenticado")
    async def generar_reporte_servicios_mas_solicitados_por_negocio(self, info: Info) -> InformePDF:
        return await PdfResolver.generar_reporte_servicios_mas_solicitados_por_negocio(info)
    
    @strawberry.field(description="Generar informe PDF de ocupación por estación del negocio del usuario autenticado")
    async def generar_reporte_ocupacion_estaciones(self, info: Info) -> InformePDF:
        return await PdfResolver.generar_reporte_ocupacion_estaciones(info)
    
    @strawberry.field(description="Generar informe PDF de ingresos del negocio del usuario autenticado")
    async def generar_reporte_ingresos(self, info: Info, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> InformePDF:
        return await PdfResolver.generar_reporte_ingresos(info, fecha_inicio, fecha_fin)

schema = strawberry.Schema(query=Query)
