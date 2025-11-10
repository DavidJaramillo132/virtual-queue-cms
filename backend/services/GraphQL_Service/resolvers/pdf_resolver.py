"""
Resolver para generación de PDFs
"""
from typing import Optional
from strawberry.types import Info
from gql_types.pdf_types import InformePDF
from services.pdf_service import PdfService
from services.decode import decode_jwt
from resolvers.usuarios_resolver import UsuariosResolver


class PdfResolver:
    """Resolver para operaciones de PDF"""
    
    @staticmethod
    async def generar_informe_usuario(info: Info) -> InformePDF:
        """
        Genera un informe PDF con los datos del perfil completo del usuario autenticado
        
        Args:
            info: Contexto de la petición GraphQL con headers
            
        Returns:
            InformePDF con el PDF en base64 o mensaje de error
        """
        try:
            # Obtener token del header
            token = info.context["request"].headers.get("authorization")
            
            if not token:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Token de autenticación no proporcionado"
                )
            
            # Decodificar token para obtener el email del usuario
            try:
                payload = decode_jwt(token.replace("Bearer ", ""))
                email = payload.get("email")
                
                if not email:
                    return InformePDF(
                        success=False,
                        pdf_base64="",
                        nombre_archivo="",
                        mensaje="Email no encontrado en el token"
                    )
            except Exception as e:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje=f"Token inválido: {str(e)}"
                )
            
            # Obtener datos completos del usuario
            from resolvers.citas_resolver import CitasResolver
            from gql_types.enums import EstadoCita
            
            # Obtener usuario
            usuario = await UsuariosResolver.find_one_by_email(email, token)
            
            # Obtener todas las citas del usuario
            todas_citas = await CitasResolver.find_all(token)
            citas_usuario = [c for c in todas_citas if c.cliente_id == usuario.id]
            
            # Calcular estadísticas de citas
            total_citas = len(citas_usuario)
            citas_completadas = len([c for c in citas_usuario if c.estado == EstadoCita.ATENDIDA.value])
            citas_pendientes = len([c for c in citas_usuario if c.estado == EstadoCita.PENDIENTE.value])
            citas_canceladas = len([c for c in citas_usuario if c.estado == EstadoCita.CANCELADA.value])
            
            # Preparar datos para el PDF
            perfil_data = {
                'id': usuario.id,
                'nombreCompleto': usuario.nombre_completo,
                'email': usuario.email,
                'telefono': usuario.telefono,
                'totalCitas': total_citas,
                'citasCompletadas': citas_completadas,
                'citasPendientes': citas_pendientes,
                'citasCanceladas': citas_canceladas
            }
            
            # Generar PDF
            pdf_service = PdfService()
            resultado = pdf_service.generar_pdf_base64(perfil_data)
            
            return InformePDF(
                success=resultado['success'],
                pdf_base64=resultado['pdfBase64'],
                nombre_archivo=resultado['nombreArchivo'],
                mensaje=resultado['mensaje']
            )
            
        except Exception as e:
            return InformePDF(
                success=False,
                pdf_base64="",
                nombre_archivo="",
                mensaje=f"Error al generar informe: {str(e)}"
            )
