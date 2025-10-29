from typing import List, Optional, Dict
from services.http_client import http_client
from gql_types.usuario_types import Usuario, UsuarioCitasDTO, PerfilCompletoUsuario, CitaInfo
from gql_types.enums import Estado
from datetime import datetime
from strawberry.types import Info


def _headers_from_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    return {"Authorization": token} if token else None


class UsuariosResolver:
    @staticmethod
    async def find_all(token: Optional[str] = None) -> List[Usuario]:
        """Get all usuarios from REST API, sending Authorization header if token provided"""
        headers = _headers_from_token(token)
        data = await http_client.get("/api/usuarios/", headers=headers)
        return [Usuario(**user) for user in data]

    @staticmethod
    async def find_one(id: str, token: Optional[str] = None) -> Usuario:
        """Get a single user by ID, sending Authorization header if token provided"""
        headers = _headers_from_token(token)
        data = await http_client.get(f"/api/usuarios/{id}", headers=headers)
        return Usuario(**data)

    @staticmethod
    async def usuarios_con_citas_pendientes(token: Optional[str] = None) -> List[UsuarioCitasDTO]:
        """Get usuarios with pending appointments"""
        from resolvers.citas_resolver import CitasResolver
        from resolvers.servicios_resolver import ServiciosResolver

        usuarios = await UsuariosResolver.find_all(token)
        citas = await CitasResolver.find_all(token)
        servicios = await ServiciosResolver.find_all(token)

        pendientes = [c for c in citas if c.estado == Estado.PENDIENTE]

        result = []
        for usuario in usuarios:
            user_citas = [c for c in pendientes if c.usuario_id == usuario.id]
            if user_citas:
                citas_info = []
                for cita in user_citas:
                    servicio = next((s for s in servicios if s.id == cita.servicio_id), None)
                    citas_info.append(CitaInfo(
                        fecha=cita.fecha,
                        servicio=servicio.nombre if servicio else None
                    ))
                result.append(UsuarioCitasDTO(
                    usuario=usuario.nombre_completo,
                    citas=citas_info
                ))

        return result

    @staticmethod
    async def usuarios_con_citas_atendidas(token: Optional[str] = None) -> List[UsuarioCitasDTO]:
        """Get usuarios with completed appointments"""
        from resolvers.citas_resolver import CitasResolver
        from resolvers.servicios_resolver import ServiciosResolver

        usuarios = await UsuariosResolver.find_all(token)
        citas = await CitasResolver.find_all(token)
        servicios = await ServiciosResolver.find_all(token)

        atendidas = [c for c in citas if c.estado == Estado.ATENDIDA]

        result = []
        for usuario in usuarios:
            user_citas = [c for c in atendidas if c.usuario_id == usuario.id]
            if user_citas:
                citas_info = []
                for cita in user_citas:
                    servicio = next((s for s in servicios if s.id == cita.servicio_id), None)
                    citas_info.append(CitaInfo(
                        fecha=cita.fecha,
                        servicio=servicio.nombre if servicio else None
                    ))
                result.append(UsuarioCitasDTO(
                    usuario=usuario.nombre_completo,
                    citas=citas_info
                ))

        return result

    @staticmethod
    async def perfil_completo_usuario(info: Info, usuario_id: str) -> PerfilCompletoUsuario:
        """Obtiene el perfil completo de un usuario con sus citas agregadas."""
        from resolvers.citas_resolver import CitasResolver

        # 1️⃣ Obtener el token del header HTTP
        token = info.context["request"].headers.get("authorization")
        if not token:
            raise Exception("Token no proporcionado en la cabecera Authorization")

        # 2️⃣ Llamar a los resolvers que hacen peticiones HTTP, reenviando el token
        usuario = await UsuariosResolver.find_one(usuario_id, token)
        todas_citas = await CitasResolver.find_all(token)

        # 3️⃣ Filtrar citas del usuario
        citas_usuario = [c for c in todas_citas if c.usuario_id == usuario_id]

        # 4️⃣ Calcular estadísticas
        total_citas = len(citas_usuario)
        citas_completadas = len([c for c in citas_usuario if c.estado == Estado.ATENDIDA])
        citas_pendientes = len([c for c in citas_usuario if c.estado == Estado.PENDIENTE])
        citas_canceladas = len([c for c in citas_usuario if c.estado == Estado.CANCELADA])

        # 5️⃣ Retornar el perfil completo
        return PerfilCompletoUsuario(
            id=usuario.id,
            nombre=usuario.nombre_completo,
            email=usuario.email,
            telefono=usuario.telefono or "",
            total_citas=total_citas,
            citas_completadas=citas_completadas,
            citas_pendientes=citas_pendientes,
            citas_canceladas=citas_canceladas
        )
