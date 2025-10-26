from typing import List
from services.http_client import http_client
from types.usuario_types import Usuario, UsuarioCitasDTO, PerfilCompletoUsuario, CitaInfo
from types.enums import Estado
from datetime import datetime

class UsuariosResolver:
    @staticmethod
    async def find_all() -> List[Usuario]:
        """Get all users from REST API"""
        data = await http_client.get("/api/users/")
        return [Usuario(**user) for user in data]
    
    @staticmethod
    async def find_one(id: str) -> Usuario:
        """Get a single user by ID"""
        data = await http_client.get(f"/api/users/{id}")
        return Usuario(**data)
    
    @staticmethod
    async def usuarios_con_citas_pendientes() -> List[UsuarioCitasDTO]:
        """Get users with pending appointments"""
        from resolvers.citas_resolver import CitasResolver
        from resolvers.servicios_resolver import ServiciosResolver
        
        usuarios = await UsuariosResolver.find_all()
        citas = await CitasResolver.find_all()
        servicios = await ServiciosResolver.find_all()
        
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
    async def usuarios_con_citas_atendidas() -> List[UsuarioCitasDTO]:
        """Get users with completed appointments"""
        from resolvers.citas_resolver import CitasResolver
        from resolvers.servicios_resolver import ServiciosResolver
        
        usuarios = await UsuariosResolver.find_all()
        citas = await CitasResolver.find_all()
        servicios = await ServiciosResolver.find_all()
        
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
    async def perfil_completo_usuario(usuario_id: str) -> PerfilCompletoUsuario:
        """Get complete user profile with aggregated data"""
        from resolvers.citas_resolver import CitasResolver
        
        usuario = await UsuariosResolver.find_one(usuario_id)
        todas_citas = await CitasResolver.find_all()
        citas_usuario = [c for c in todas_citas if c.usuario_id == usuario_id]
        
        total_citas = len(citas_usuario)
        citas_completadas = len([c for c in citas_usuario if c.estado == Estado.ATENDIDA])
        citas_pendientes = len([c for c in citas_usuario if c.estado == Estado.PENDIENTE])
        citas_canceladas = len([c for c in citas_usuario if c.estado == Estado.CANCELADA])
        
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
