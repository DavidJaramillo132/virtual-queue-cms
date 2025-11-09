import strawberry
from typing import Optional


@strawberry.type
class InformePDF:
    """Tipo para el resultado de generación de PDF"""
    success: bool
    pdf_base64: str = strawberry.field(description="PDF codificado en base64")
    nombre_archivo: str = strawberry.field(description="Nombre sugerido para el archivo")
    mensaje: str = strawberry.field(description="Mensaje de éxito o error")
