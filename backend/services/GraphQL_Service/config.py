import os
from typing import Optional
from dotenv import load_dotenv

class Config:
    # JWT secret key
    load_dotenv()

    # cargar variables de entorno desde el archivo .env
    JWT_SECRET: str = os.getenv("JWT_SECRET")

    # Asegurarse de que la variable JWT_SECRET esté definida
    if not JWT_SECRET:
        raise Exception("JWT_SECRET no encontrado en .env")

    # Base URL for the REST API
    REST_API_BASE_URL: str = os.getenv("REST_API_BASE_URL", "http://localhost:3000")
    
    # Server configuration
    PORT: int = int(os.getenv("PORT", "3001"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # HTTP client configuration
    HTTP_TIMEOUT: int = 5
    HTTP_MAX_REDIRECTS: int = 5
    

config = Config()
