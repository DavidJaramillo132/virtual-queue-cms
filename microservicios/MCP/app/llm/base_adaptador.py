from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class LLMAdapter(ABC):
    @abstractmethod
    async def chat(self, mensaje: str, 
                   herramienta: Optional[Dict[str, Any]] = None,
                   contexto: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def procesar_imagen(self, imagen: bytes, 
                              herramienta: Optional[Dict[str, Any]] = None,
                              contexto: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def extraer_texto_imagen(self, imagen: bytes) -> str:
        # Extrae texto de una imagen
        pass

    @abstractmethod
    async def extraer_texto_pdf(self, pdf: bytes) -> str:
        # Extrae texto de un PDF
        pass
    
    # Nunca se usa 
    @abstractmethod
    async def extraer_texto_audio(self, audio: bytes) -> str:
        # Extrae texto de un archivo de audio
        pass