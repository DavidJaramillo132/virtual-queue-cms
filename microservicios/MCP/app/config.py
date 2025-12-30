"""
Configuración del microservicio MCP
"""
import os
from typing import Optional


class Config:
    """Configuración centralizada del microservicio"""
    
    # URLs de servicios
    REST_API_URL: str = os.getenv("REST_API_URL", "http://localhost:3000/api")
    GRAPHQL_API_URL: str = os.getenv("GRAPHQL_API_URL", "http://localhost:4000/graphql")
    WEBSOCKET_URL: str = os.getenv("WEBSOCKET_URL", "ws://localhost:8080/ws")
    
    # Configuración de LLM
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    
    # Configuración de la aplicación
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Timeouts
    API_TIMEOUT: int = int(os.getenv("API_TIMEOUT", "10"))
    
    # Límites
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    
    @classmethod
    def validate(cls):
        """Valida que las configuraciones críticas estén presentes"""
        errors = []
        
        if not cls.GEMINI_API_KEY and not cls.OPENAI_API_KEY:
            errors.append("Al menos una API key (GEMINI_API_KEY o OPENAI_API_KEY) debe estar configurada")
        
        if errors:
            raise ValueError(f"Errores de configuración: {', '.join(errors)}")


# Instancia global de configuración
config = Config()
