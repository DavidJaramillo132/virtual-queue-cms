from typing import List, Optional, Dict

from strawberry import Info
from services.decode import decode_jwt
from services.http_client import http_client
from gql_types.servicio_types import Servicio, RankingServicios
from resolvers.citas_resolver import CitasResolver


def _headers_from_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    return {"Authorization": token} if token else None


class ServiciosResolver:
    @staticmethod
    def _normalize_servicio_data(servicio_data: dict) -> dict:
        """Normaliza los datos del servicio del formato REST API al formato GraphQL"""
        # Campos permitidos en el tipo Servicio de GraphQL
        allowed_fields = {
            'id', 'negocio_id', 'nombre', 'descripcion',
            'duracion_minutos', 'precio_centavos', 'creado_en', 'creadoEn'
        }
        # Filtrar solo campos permitidos
        normalized = {k: v for k, v in servicio_data.items() if k in allowed_fields}
        # Normalizar creadoEn a creado_en
        if 'creadoEn' in normalized:
            normalized['creado_en'] = str(normalized.pop('creadoEn'))
        return normalized
    
    @staticmethod
    async def find_all(token: Optional[str] = None) -> List[Servicio]:
        """Get all services from REST API. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/servicios", headers=headers)
        return [Servicio(**ServiciosResolver._normalize_servicio_data(servicio)) for servicio in data]
    
    @staticmethod
    async def find_one(id: str, token: Optional[str] = None) -> Servicio:
        """Get a single service by ID. Forward token if provided."""
        headers = _headers_from_token(token)
        data = await http_client.get(f"/api/servicios/{id}", headers=headers)
        # Si la API devuelve una lista, tomar el primer elemento
        if isinstance(data, list):
            if len(data) == 0:
                raise Exception(f"Servicio con id {id} no encontrado")
            data = data[0]
        return Servicio(**ServiciosResolver._normalize_servicio_data(data))


    # @staticmethod
    # async def generar_reporte_servicios_mas_solicitados_por_negocio(info: Info) -> List[RankingServicios]:
    #     """
    #     Obtiene el ranking de servicios más contratados del negocio del usuario autenticado
        
    #     Args:
    #         info: Contexto de la petición GraphQL con headers
            
    #     Returns:
    #         Lista de RankingServicios ordenada por total de citas (descendente) del negocio del usuario
    #     """
    #     # Obtener el token del header HTTP
    #     token = info.context["request"].headers.get("authorization")
    #     if not token:
    #         raise Exception("Token no proporcionado en la cabecera Authorization")

    #     # Decodificar token para obtener el email del usuario
    #     payload = decode_jwt(token.replace("Bearer ", ""))
    #     email = payload.get("email")
        
    #     if not email:
    #         raise Exception("Email no encontrado en el token")
        
    #     # Obtener usuario y verificar que sea de tipo negocio
    #     from resolvers.usuarios_resolver import UsuariosResolver
    #     from resolvers.negocios_resolver import NegociosResolver
        
    #     usuario = await UsuariosResolver.find_one_by_email(email, token)
        
    #     # Verificar que el usuario sea de tipo negocio
    #     rol_usuario = usuario.rol.value if hasattr(usuario.rol, 'value') else str(usuario.rol)
    #     if rol_usuario != "negocio":
    #         raise Exception("Esta funcionalidad solo está disponible para administradores de negocio")
        
    #     # Obtener todos los negocios y filtrar por admin_negocio_id
    #     todos_negocios = await NegociosResolver.find_all(token)
    #     negocios_usuario = [n for n in todos_negocios if n.admin_negocio_id == usuario.id]
        
    #     if not negocios_usuario:
    #         raise Exception("No se encontró el negocio asociado al usuario")
        
    #     # Tomar el primer negocio del usuario
    #     negocio_id = negocios_usuario[0].id
        
    #     # Obtener todas las citas y servicios
    #     todas_citas = await CitasResolver.find_all(token)
    #     todos_servicios = await ServiciosResolver.find_all(token)
        
    #     # Filtrar citas y servicios del negocio
    #     citas_negocio = [c for c in todas_citas if c.negocio_id == negocio_id]
    #     servicios_negocio = [s for s in todos_servicios if s.negocio_id == negocio_id]
        
    #     # Crear mapa de servicios por ID para acceso rápido
    #     servicios_map = {s.id: s.nombre for s in servicios_negocio}
        
    #     # Contar citas por servicio (solo del negocio)
    #     citas_por_servicio = {}
    #     for cita in citas_negocio:
    #         servicio_id = cita.servicio_id
    #         if servicio_id in servicios_map:
    #             servicio_nombre = servicios_map[servicio_id]
    #             if servicio_nombre not in citas_por_servicio:
    #                 citas_por_servicio[servicio_nombre] = 0
    #             citas_por_servicio[servicio_nombre] += 1
        
    #     # Ordenar por cantidad de citas (descendente) y crear lista de RankingServicios
    #     ranking_ordenado = sorted(
    #         citas_por_servicio.items(),
    #         key=lambda x: x[1],
    #         reverse=True
    #     )
        
    #     # Convertir a lista de RankingServicios
    #     resultado = [
    #         RankingServicios(
    #             servicio=nombre,
    #             total_citas=total_citas
    #         )
    #         for nombre, total_citas in ranking_ordenado
    #     ]
        
    #     return resultado
