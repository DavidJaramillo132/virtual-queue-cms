# genera el PDF del informe del usuario
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER
from datetime import datetime
from io import BytesIO
import base64


class PdfService:
    """Servicio para generar PDFs con datos del usuario"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configurar estilos personalizados para el documento"""
        # Título principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

        # Subtítulos
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))

        # Texto normal
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#374151'),
            spaceAfter=6,
        ))
    
    def _add_header(self, elements: list, titulo_texto: str = "Informe de Perfil de Usuario"):
        """Agregar encabezado del documento"""
        titulo = Paragraph(titulo_texto, self.styles['CustomTitle'])
        elements.append(titulo)
        elements.append(Spacer(1, 0.2 * inch))

        fecha_actual = datetime.now().strftime("%d de %B de %Y")
        subtitulo = Paragraph(f"Generado el {fecha_actual}", self.styles['CustomBody'])
        elements.append(subtitulo)
        elements.append(Spacer(1, 0.3 * inch))
    
    def _add_user_info(self, elements: list, usuario_data: dict):
        """Agregar información del usuario"""
        seccion_titulo = Paragraph("Información Personal", self.styles['CustomHeading'])
        elements.append(seccion_titulo)
        elements.append(Spacer(1, 0.1 * inch))



        user_data = [
            ['Campo', 'Información'],
            ['Nombre completo', usuario_data.get('nombreCompleto', 'N/A')],
            ['Email', usuario_data.get('email', 'N/A')],
            ['Teléfono', usuario_data.get('telefono', 'No especificado')],
        ]

        tabla_usuario = Table(user_data, colWidths=[2.5 * inch, 4 * inch])
        tabla_usuario.setStyle(TableStyle([
            # Encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Contenido
            ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#e0e7ff')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1e293b')),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 1), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))

        elements.append(tabla_usuario)
        elements.append(Spacer(1, 0.3 * inch))
    
    def _add_appointments_summary(self, elements: list, resumen_citas: dict):
        """Agregar resumen de citas"""
        seccion_titulo = Paragraph("Resumen de Citas", self.styles['CustomHeading'])
        elements.append(seccion_titulo)
        elements.append(Spacer(1, 0.1 * inch))

        total = resumen_citas.get('totalCitas', 0)
        completadas = resumen_citas.get('citasCompletadas', 0)
        pendientes = resumen_citas.get('citasPendientes', 0)
        canceladas = resumen_citas.get('citasCanceladas', 0)

        # Calcular porcentajes
        porcentaje_completadas = (completadas / total * 100) if total > 0 else 0
        porcentaje_pendientes = (pendientes / total * 100) if total > 0 else 0
        porcentaje_canceladas = (canceladas / total * 100) if total > 0 else 0

        citas_data = [
            ['Estado', 'Cantidad', 'Porcentaje'],
            ['Total de citas', str(total), '100%'],
            ['Citas completadas', str(completadas), f'{porcentaje_completadas:.1f}%'],
            ['Citas pendientes', str(pendientes), f'{porcentaje_pendientes:.1f}%'],
            ['Citas canceladas', str(canceladas), f'{porcentaje_canceladas:.1f}%'],
        ]

        tabla_citas = Table(citas_data, colWidths=[2.5 * inch, 2 * inch, 2 * inch])
        tabla_citas.setStyle(TableStyle([
            # Encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#16a34a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Fila total
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#dbeafe')),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            
            # Filas de datos
            ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#dcfce7')),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#fef9c3')),
            ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#fee2e2')),
            
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1e293b')),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))

        elements.append(tabla_citas)
        elements.append(Spacer(1, 0.3 * inch))
    
    def generar_reporte_servicios_mas_solicitados_por_negocio(self, reporte_data: dict) -> dict:
        """
        Genera un PDF de reporte de servicios más solicitados del negocio
        
        Args:
            reporte_data: Diccionario con datos del reporte
                - nombreNegocio: str
                - ranking: list (lista de servicios con nombre y total_citas)
        
        Returns:
            dict con 'pdfBase64', 'nombreArchivo' y 'mensaje'
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18,
            )
            
            elements = []
            
            # Encabezado
            nombre_negocio = reporte_data.get('nombreNegocio', 'Negocio')
            self._add_header(elements, f"Reporte de Servicios Más Solicitados - {nombre_negocio}")
            
            # Ranking de servicios
            ranking = reporte_data.get('ranking', [])
            if ranking:
                ranking_data = [['Posición', 'Servicio', 'Total de Citas']]
                for idx, item in enumerate(ranking, 1):
                    ranking_data.append([
                        str(idx),
                        item.get('servicio', 'N/A'),
                        str(item.get('total_citas', 0))
                    ])
                
                tabla_ranking = Table(ranking_data, colWidths=[1 * inch, 3.5 * inch, 1.5 * inch])
                tabla_ranking.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1e293b')),
                    ('ALIGN', (0, 1), (0, -1), 'CENTER'),
                    ('ALIGN', (2, 1), (2, -1), 'CENTER'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ]))
                
                elements.append(tabla_ranking)
            
            # Construir PDF
            doc.build(elements)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            # Convertir a base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            # Generar nombre de archivo
            nombre_archivo = f"Reporte_Servicios_Mas_Solicitados_{nombre_negocio.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            return {
                'success': True,
                'pdfBase64': pdf_base64,
                'nombreArchivo': nombre_archivo,
                'mensaje': 'PDF generado exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'pdfBase64': '',
                'nombreArchivo': '',
                'mensaje': f'Error al generar PDF: {str(e)}'
            }
    
    def generar_reporte_ocupacion_estaciones(self, reporte_data: dict) -> dict:
        """
        Genera un PDF de reporte de ocupación por estación del negocio
        
        Args:
            reporte_data: Diccionario con datos del reporte
                - nombreNegocio: str
                - estaciones: list (lista de estaciones con nombre, total_citas, citas_atendidas, etc.)
        
        Returns:
            dict con 'pdfBase64', 'nombreArchivo' y 'mensaje'
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18,
            )
            
            elements = []
            
            # Encabezado
            nombre_negocio = reporte_data.get('nombreNegocio', 'Negocio')
            self._add_header(elements, f"Reporte de Ocupación por Estación - {nombre_negocio}")
            
            # Datos de ocupación por estación
            estaciones = reporte_data.get('estaciones', [])
            if estaciones:
                ocupacion_data = [['Estación', 'Total Citas', 'Citas Atendidas', 'Citas Pendientes']]
                for estacion in estaciones:
                    total = estacion.get('total_citas', 0)
                    atendidas = estacion.get('citas_atendidas', 0)
                    pendientes = estacion.get('citas_pendientes', 0)
                    
                    ocupacion_data.append([
                        estacion.get('nombre', 'N/A'),
                        str(total),
                        str(atendidas),
                        str(pendientes)
                    ])
                
                tabla_ocupacion = Table(ocupacion_data, colWidths=[2.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch])
                tabla_ocupacion.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 11),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1e293b')),
                    ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ]))
                
                elements.append(tabla_ocupacion)
            
            # Construir PDF
            doc.build(elements)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            # Convertir a base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            # Generar nombre de archivo
            nombre_archivo = f"Reporte_Ocupacion_Estaciones_{nombre_negocio.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            return {
                'success': True,
                'pdfBase64': pdf_base64,
                'nombreArchivo': nombre_archivo,
                'mensaje': 'PDF generado exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'pdfBase64': '',
                'nombreArchivo': '',
                'mensaje': f'Error al generar PDF: {str(e)}'
            }
    
    def generar_reporte_ingresos(self, reporte_data: dict) -> dict:
        """
        Genera un PDF de reporte de ingresos del negocio
        
        Args:
            reporte_data: Diccionario con datos del reporte
                - nombreNegocio: str
                - fechaInicio: str (opcional)
                - fechaFin: str (opcional)
                - totalIngresos: float
                - ingresosPorServicio: list (lista con servicio y ingresos)
                - ingresosPorMes: list (lista con mes y ingresos) - opcional
        
        Returns:
            dict con 'pdfBase64', 'nombreArchivo' y 'mensaje'
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18,
            )
            
            elements = []
            
            # Encabezado
            nombre_negocio = reporte_data.get('nombreNegocio', 'Negocio')
            self._add_header(elements, f"Reporte de Ingresos - {nombre_negocio}")
            
            # Información del período
            fecha_inicio = reporte_data.get('fechaInicio', '')
            fecha_fin = reporte_data.get('fechaFin', '')
            if fecha_inicio or fecha_fin:
                periodo_texto = f"Período: {fecha_inicio} a {fecha_fin}" if fecha_inicio and fecha_fin else f"Desde: {fecha_inicio}" if fecha_inicio else f"Hasta: {fecha_fin}"
                periodo = Paragraph(periodo_texto, self.styles['CustomBody'])
                elements.append(periodo)
                elements.append(Spacer(1, 0.2 * inch))
            
            # Total de ingresos
            total_ingresos = reporte_data.get('totalIngresos', 0)
            seccion_total = Paragraph("Resumen de Ingresos", self.styles['CustomHeading'])
            elements.append(seccion_total)
            elements.append(Spacer(1, 0.1 * inch))
            
            total_data = [
                ['Concepto', 'Monto'],
                ['Total de Ingresos', f"${total_ingresos:,.2f}"]
            ]
            
            tabla_total = Table(total_data, colWidths=[3 * inch, 3 * inch])
            tabla_total.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#d1fae5')),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1e293b')),
                ('ALIGN', (1, 1), (-1, 1), 'RIGHT'),
                ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
                ('FONTSIZE', (1, 1), (-1, 1), 14),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 1), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 12),
            ]))
            
            elements.append(tabla_total)
            elements.append(Spacer(1, 0.3 * inch))
            
            # Ingresos por servicio
            ingresos_por_servicio = reporte_data.get('ingresosPorServicio', [])
            if ingresos_por_servicio:
                seccion_servicios = Paragraph("Ingresos por Servicio", self.styles['CustomHeading'])
                elements.append(seccion_servicios)
                elements.append(Spacer(1, 0.1 * inch))
                
                servicios_data = [['Servicio', 'Ingresos']]
                for item in ingresos_por_servicio:
                    servicios_data.append([
                        item.get('servicio', 'N/A'),
                        f"${item.get('ingresos', 0):,.2f}"
                    ])
                
                tabla_servicios = Table(servicios_data, colWidths=[3.5 * inch, 2.5 * inch])
                tabla_servicios.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 11),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1e293b')),
                    ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ]))
                
                elements.append(tabla_servicios)
                elements.append(Spacer(1, 0.3 * inch))
            
            # Construir PDF
            doc.build(elements)
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            # Convertir a base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            # Generar nombre de archivo
            nombre_archivo = f"Reporte_Ingresos_{nombre_negocio.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            return {
                'success': True,
                'pdfBase64': pdf_base64,
                'nombreArchivo': nombre_archivo,
                'mensaje': 'PDF generado exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'pdfBase64': '',
                'nombreArchivo': '',
                'mensaje': f'Error al generar PDF: {str(e)}'
            }

    
    def generar_pdf_base64(self, perfil_data: dict) -> dict:
        """
        Genera un PDF y lo retorna en base64
        
        Args:
            perfil_data: Diccionario con datos del perfil completo del usuario
            
        Returns:
            dict con 'pdfBase64', 'nombreArchivo' y 'mensaje'
        """
        try:
            # Crear buffer en memoria
            buffer = BytesIO()
            
            # Crear documento PDF en memoria
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18,
            )
            
            elements = []
            
            # Agregar secciones
            self._add_header(elements, "Informe de Perfil de Usuario")
            self._add_user_info(elements, perfil_data)
            
            # Preparar resumen de citas
            resumen_citas = {
                'totalCitas': perfil_data.get('totalCitas', 0),
                'citasCompletadas': perfil_data.get('citasCompletadas', 0),
                'citasPendientes': perfil_data.get('citasPendientes', 0),
                'citasCanceladas': perfil_data.get('citasCanceladas', 0),
            }
            self._add_appointments_summary(elements, resumen_citas)
            
            # Construir PDF
            doc.build(elements)
            
            # Obtener bytes del PDF
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            # Convertir a base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            # Generar nombre de archivo
            nombre_completo = perfil_data.get('nombreCompleto', 'Usuario')
            nombre_archivo = f"Informe_{nombre_completo.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            return {
                'success': True,
                'pdfBase64': pdf_base64,
                'nombreArchivo': nombre_archivo,
                'mensaje': 'PDF generado exitosamente'
            }
            
        except Exception as e:
            return {
                'success': False,
                'pdfBase64': '',
                'nombreArchivo': '',
                'mensaje': f'Error al generar PDF: {str(e)}'
            }
