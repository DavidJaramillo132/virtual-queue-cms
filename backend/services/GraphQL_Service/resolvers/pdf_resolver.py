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
    
    @staticmethod
    async def generar_reporte_servicios_mas_solicitados_por_negocio(info: Info) -> InformePDF:
        """
        Genera un informe PDF de servicios más solicitados del negocio del usuario autenticado
        
        Args:
            info: Contexto de la petición GraphQL con headers
            
        Returns:
            InformePDF con el PDF en base64 o mensaje de error
        """
        try:
            token = info.context["request"].headers.get("authorization")
            
            if not token:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Token de autenticación no proporcionado"
                )
            
            # Decodificar token para obtener el email del usuario
            payload = decode_jwt(token.replace("Bearer ", ""))
            email = payload.get("email")
            print(payload)
            if not email:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Email no encontrado en el token"
                )
            id_negocio = payload.get("negocio_id")
            # Obtener usuario y verificar que sea de tipo negocio
            usuario = await UsuariosResolver.find_one_by_email(email, token)
            
            # Verificar que el usuario sea de tipo negocio
            rol_usuario = usuario.rol.value if hasattr(usuario.rol, 'value') else str(usuario.rol)
            if rol_usuario != "negocio":
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Esta funcionalidad solo está disponible para administradores de negocio"
                )
            
            # Obtener negocio_id del usuario desde la relación negocios
            from resolvers.negocios_resolver import NegociosResolver
            from resolvers.servicios_resolver import ServiciosResolver
            from resolvers.citas_resolver import CitasResolver
            
            # Obtener todos los negocios y filtrar por admin_negocio_id
            todos_negocios = await NegociosResolver.find_all(token)
            negocios_usuario = [n for n in todos_negocios if n.admin_negocio_id == usuario.id]
            
            if not negocios_usuario:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="No se encontró el negocio asociado al usuario"
                )
            
            # Tomar el primer negocio del usuario
            negocio_id = negocios_usuario[0].id
            negocio = await NegociosResolver.find_one(negocio_id, token)
            
            # Obtener todas las citas y servicios del negocio
            todas_citas = await CitasResolver.find_all(token)
            todos_servicios = await ServiciosResolver.find_all(token)
            
            # Filtrar citas y servicios del negocio
            citas_negocio = [c for c in todas_citas if c.negocio_id == negocio_id]
            servicios_negocio = [s for s in todos_servicios if s.negocio_id == negocio_id]
            
            # Crear mapa de servicios por ID
            servicios_map = {s.id: s.nombre for s in servicios_negocio}
            
            # Contar citas por servicio
            citas_por_servicio = {}
            for cita in citas_negocio:
                servicio_id = cita.servicio_id
                if servicio_id in servicios_map:
                    servicio_nombre = servicios_map[servicio_id]
                    if servicio_nombre not in citas_por_servicio:
                        citas_por_servicio[servicio_nombre] = 0
                    citas_por_servicio[servicio_nombre] += 1
            
            # Ordenar por cantidad de citas (descendente)
            ranking = sorted(
                [{'servicio': nombre, 'total_citas': count} for nombre, count in citas_por_servicio.items()],
                key=lambda x: x['total_citas'],
                reverse=True
            )
            
            # Preparar datos para el PDF
            reporte_data = {
                'nombreNegocio': negocio.nombre,
                'ranking': ranking
            }
            
            # Generar PDF
            pdf_service = PdfService()
            resultado = pdf_service.generar_reporte_servicios_mas_solicitados_por_negocio(reporte_data)
            
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
    
    @staticmethod
    async def generar_reporte_ocupacion_estaciones(info: Info) -> InformePDF:
        """
        Genera un informe PDF de ocupación por estación del negocio del usuario autenticado
        
        Args:
            info: Contexto de la petición GraphQL con headers
            
        Returns:
            InformePDF con el PDF en base64 o mensaje de error
        """
        try:
            token = info.context["request"].headers.get("authorization")
            
            if not token:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Token de autenticación no proporcionado"
                )
            
            # Decodificar token para obtener el email del usuario
            payload = decode_jwt(token.replace("Bearer ", ""))
            email = payload.get("email")
            
            if not email:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Email no encontrado en el token"
                )
            
            # Obtener usuario y verificar que sea de tipo negocio
            usuario = await UsuariosResolver.find_one_by_email(email, token)
            
            # Verificar que el usuario sea de tipo negocio
            rol_usuario = usuario.rol.value if hasattr(usuario.rol, 'value') else str(usuario.rol)
            if rol_usuario != "negocio":
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Esta funcionalidad solo está disponible para administradores de negocio"
                )
            
            # Obtener negocio_id del usuario desde la relación negocios
            from resolvers.negocios_resolver import NegociosResolver
            from resolvers.estaciones_resolver import EstacionesResolver
            from resolvers.citas_resolver import CitasResolver
            from gql_types.enums import EstadoCita
            
            # Obtener todos los negocios y filtrar por admin_negocio_id
            todos_negocios = await NegociosResolver.find_all(token)
            negocios_usuario = [n for n in todos_negocios if n.admin_negocio_id == usuario.id]
            
            if not negocios_usuario:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="No se encontró el negocio asociado al usuario"
                )
            
            # Tomar el primer negocio del usuario
            negocio_id = negocios_usuario[0].id
            negocio = await NegociosResolver.find_one(negocio_id, token)
            
            # Obtener estaciones y citas del negocio
            todas_estaciones = await EstacionesResolver.find_all(token)
            todas_citas = await CitasResolver.find_all(token)
            
            # Filtrar estaciones y citas del negocio
            estaciones_negocio = [e for e in todas_estaciones if e.negocio_id == negocio_id]
            citas_negocio = [c for c in todas_citas if c.negocio_id == negocio_id]
            
            # Calcular ocupación por estación
            ocupacion_estaciones = []
            for estacion in estaciones_negocio:
                citas_estacion = [c for c in citas_negocio if c.estacion_id == estacion.id]
                total_citas = len(citas_estacion)
                citas_atendidas = len([c for c in citas_estacion if c.estado == EstadoCita.ATENDIDA.value])
                citas_pendientes = len([c for c in citas_estacion if c.estado == EstadoCita.PENDIENTE.value])
                
                ocupacion_estaciones.append({
                    'nombre': estacion.nombre,
                    'total_citas': total_citas,
                    'citas_atendidas': citas_atendidas,
                    'citas_pendientes': citas_pendientes
                })
            
            # Preparar datos para el PDF
            reporte_data = {
                'nombreNegocio': negocio.nombre,
                'estaciones': ocupacion_estaciones
            }
            
            # Generar PDF
            pdf_service = PdfService()
            resultado = pdf_service.generar_reporte_ocupacion_estaciones(reporte_data)
            
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
    
    @staticmethod
    async def generar_reporte_ingresos(info: Info, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None) -> InformePDF:
        """
        Genera un informe PDF de ingresos del negocio del usuario autenticado
        
        Args:
            info: Contexto de la petición GraphQL con headers
            fecha_inicio: Fecha de inicio del período (opcional)
            fecha_fin: Fecha de fin del período (opcional)
            
        Returns:
            InformePDF con el PDF en base64 o mensaje de error
        """
        try:
            token = info.context["request"].headers.get("authorization")
            
            if not token:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Token de autenticación no proporcionado"
                )
            
            # Decodificar token para obtener el email del usuario
            payload = decode_jwt(token.replace("Bearer ", ""))
            email = payload.get("email")
            
            if not email:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Email no encontrado en el token"
                )
            
            # Obtener usuario y verificar que sea de tipo negocio
            usuario = await UsuariosResolver.find_one_by_email(email, token)
            
            # Verificar que el usuario sea de tipo negocio
            rol_usuario = usuario.rol.value if hasattr(usuario.rol, 'value') else str(usuario.rol)
            if rol_usuario != "negocio":
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="Esta funcionalidad solo está disponible para administradores de negocio"
                )
            
            # Obtener negocio_id del usuario desde la relación negocios
            from resolvers.negocios_resolver import NegociosResolver
            from resolvers.servicios_resolver import ServiciosResolver
            from resolvers.citas_resolver import CitasResolver
            from gql_types.enums import EstadoCita
            
            # Obtener todos los negocios y filtrar por admin_negocio_id
            todos_negocios = await NegociosResolver.find_all(token)
            negocios_usuario = [n for n in todos_negocios if n.admin_negocio_id == usuario.id]
            
            if not negocios_usuario:
                return InformePDF(
                    success=False,
                    pdf_base64="",
                    nombre_archivo="",
                    mensaje="No se encontró el negocio asociado al usuario"
                )
            
            # Tomar el primer negocio del usuario
            negocio_id = negocios_usuario[0].id
            negocio = await NegociosResolver.find_one(negocio_id, token)
            
            # Obtener citas y servicios del negocio
            todas_citas = await CitasResolver.find_all(token)
            todos_servicios = await ServiciosResolver.find_all(token)
            
            # Filtrar citas del negocio y solo las atendidas
            citas_negocio = [c for c in todas_citas if c.negocio_id == negocio_id]
            citas_atendidas = [c for c in citas_negocio if c.estado == EstadoCita.ATENDIDA.value]
            
            # Filtrar por fechas si se proporcionan
            if fecha_inicio:
                from datetime import datetime
                fecha_inicio_dt = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
                citas_atendidas = [c for c in citas_atendidas if c.fecha >= fecha_inicio_dt]
            
            if fecha_fin:
                from datetime import datetime
                fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
                citas_atendidas = [c for c in citas_atendidas if c.fecha <= fecha_fin_dt]
            
            # Filtrar servicios del negocio
            servicios_negocio = [s for s in todos_servicios if s.negocio_id == negocio_id]
            
            # Crear mapa de servicios por ID (precio en centavos, convertir a dólares)
            servicios_map = {}
            for s in servicios_negocio:
                precio_dolares = s.precio_centavos / 100.0 if hasattr(s, 'precio_centavos') else 0.0
                servicios_map[s.id] = {
                    'nombre': s.nombre,
                    'precio': precio_dolares
                }
            
            # Calcular ingresos por servicio
            ingresos_por_servicio = {}
            total_ingresos = 0.0
            
            for cita in citas_atendidas:
                servicio_id = cita.servicio_id
                if servicio_id in servicios_map:
                    servicio_info = servicios_map[servicio_id]
                    servicio_nombre = servicio_info['nombre']
                    precio = servicio_info['precio']
                    
                    if servicio_nombre not in ingresos_por_servicio:
                        ingresos_por_servicio[servicio_nombre] = 0.0
                    
                    ingresos_por_servicio[servicio_nombre] += precio
                    total_ingresos += precio
            
            # Preparar datos para el PDF
            reporte_data = {
                'nombreNegocio': negocio.nombre,
                'fechaInicio': fecha_inicio or '',
                'fechaFin': fecha_fin or '',
                'totalIngresos': total_ingresos,
                'ingresosPorServicio': [
                    {'servicio': nombre, 'ingresos': ingresos}
                    for nombre, ingresos in ingresos_por_servicio.items()
                ]
            }
            
            # Generar PDF
            pdf_service = PdfService()
            resultado = pdf_service.generar_reporte_ingresos(reporte_data)
            
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