"""
Generador de informes PDF para usuarios del sistema de colas virtuales
Genera un informe profesional con los datos del perfil del usuario y resumen de citas
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import json
import sys
import os


class InformeUsuarioPDF:
    def __init__(self, output_path: str):
        self.output_path = output_path
        self.doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )
        self.elements = []
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

    def _add_header(self, datos_usuario: dict):
        """Agregar encabezado del documento"""
        # Título principal
        titulo = Paragraph("Informe de Perfil de Usuario", self.styles['CustomTitle'])
        self.elements.append(titulo)
        self.elements.append(Spacer(1, 0.2 * inch))

        # Subtítulo con fecha
        fecha_actual = datetime.now().strftime("%d de %B de %Y")
        subtitulo = Paragraph(
            f"Generado el {fecha_actual}",
            self.styles['CustomBody']
        )
        self.elements.append(subtitulo)
        self.elements.append(Spacer(1, 0.3 * inch))

    def _add_user_info(self, datos_usuario: dict):
        """Agregar información del usuario"""
        # Título de sección
        seccion_titulo = Paragraph("Información Personal", self.styles['CustomHeading'])
        self.elements.append(seccion_titulo)
        self.elements.append(Spacer(1, 0.1 * inch))

        # Crear tabla con información del usuario
        user_data = [
            ['Campo', 'Información'],
            ['Nombre completo', datos_usuario.get('nombre', 'N/A')],
            ['Email', datos_usuario.get('email', 'N/A')],
            ['Teléfono', datos_usuario.get('telefono', 'N/A')],
            ['Fecha de registro', datos_usuario.get('fechaCreacion', 'N/A')],
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

        self.elements.append(tabla_usuario)
        self.elements.append(Spacer(1, 0.3 * inch))

    def _add_appointments_summary(self, resumen_citas: dict):
        """Agregar resumen de citas"""
        # Título de sección
        seccion_titulo = Paragraph("Resumen de Citas", self.styles['CustomHeading'])
        self.elements.append(seccion_titulo)
        self.elements.append(Spacer(1, 0.1 * inch))

        # Crear tabla con resumen de citas
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
            ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#dcfce7')),  # Completadas - verde claro
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#fef9c3')),  # Pendientes - amarillo claro
            ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#fee2e2')),  # Canceladas - rojo claro
            
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1e293b')),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))

        self.elements.append(tabla_citas)
        self.elements.append(Spacer(1, 0.3 * inch))

    def _add_footer(self):
        """Agregar pie de página con información adicional"""
        self.elements.append(Spacer(1, 0.5 * inch))
        
        footer_text = Paragraph(
            "<i>Este informe es confidencial y está destinado únicamente para uso del usuario registrado. "
            "Sistema de Gestión de Colas Virtuales - Virtual Queue CMS.</i>",
            ParagraphStyle(
                name='Footer',
                parent=self.styles['Normal'],
                fontSize=8,
                textColor=colors.HexColor('#6b7280'),
                alignment=TA_CENTER,
            )
        )
        self.elements.append(footer_text)

    def generar(self, datos_json: dict) -> str:
        """
        Generar el PDF con los datos proporcionados
        
        Args:
            datos_json: Diccionario con la estructura:
                {
                    'usuario': {...},
                    'resumenCitas': {...}
                }
        
        Returns:
            str: Ruta del archivo PDF generado
        """
        try:
            datos_usuario = datos_json.get('usuario', {})
            resumen_citas = datos_json.get('resumenCitas', {})

            # Agregar secciones al documento
            self._add_header(datos_usuario)
            self._add_user_info(datos_usuario)
            self._add_appointments_summary(resumen_citas)
            self._add_footer()

            # Construir el PDF
            self.doc.build(self.elements)
            
            return self.output_path

        except Exception as e:
            raise Exception(f"Error al generar el PDF: {str(e)}")


def main():
    """
    Función principal para uso desde línea de comandos
    Recibe JSON por stdin y genera el PDF
    """
    try:
        # Leer JSON desde stdin
        input_data = sys.stdin.read()
        datos = json.loads(input_data)
        
        # Obtener ruta de salida
        output_path = datos.get('outputPath', 'informe_usuario.pdf')
        
        # Generar PDF
        generador = InformeUsuarioPDF(output_path)
        pdf_path = generador.generar(datos)
        
        # Retornar resultado exitoso
        print(json.dumps({
            'success': True,
            'path': pdf_path,
            'message': 'PDF generado exitosamente'
        }))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
