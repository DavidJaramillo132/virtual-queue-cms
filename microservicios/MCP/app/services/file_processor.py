"""
Utilidades para procesamiento de archivos multimodales (PDF, imágenes, etc.)
"""

import base64
from typing import Dict, Any
import PyPDF2
from io import BytesIO


def extraer_texto_pdf_pypdf2(pdf_bytes: bytes) -> str:
    """
    Extrae texto de un PDF usando PyPDF2.
    
    Args:
        pdf_bytes: Bytes del archivo PDF
    
    Returns:
        str: Texto extraído del PDF
    """
    try:
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
        texto_completo = []
        
        for pagina in pdf_reader.pages:
            texto = pagina.extract_text()
            if texto:
                texto_completo.append(texto)
        
        return "\n\n".join(texto_completo)
    except Exception as e:
        raise Exception(f"Error al extraer texto del PDF con PyPDF2: {str(e)}")


def procesar_texto_para_negocio(texto: str) -> str:
    """
    Procesa el texto extraído para optimizarlo para el LLM.
    Limpia y formatea el texto para facilitar la extracción de información.
    
    Args:
        texto: Texto extraído del documento
    
    Returns:
        str: Texto procesado y optimizado
    """
    # Eliminar líneas vacías excesivas
    lineas = [linea.strip() for linea in texto.split('\n') if linea.strip()]
    texto_limpio = '\n'.join(lineas)
    
    # Limitar longitud si es muy largo (mantener primeros caracteres más relevantes)
    max_chars = 10000
    if len(texto_limpio) > max_chars:
        texto_limpio = texto_limpio[:max_chars] + "...\n[Texto truncado por longitud]"
    
    return texto_limpio
