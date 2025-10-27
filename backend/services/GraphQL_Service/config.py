import os
from typing import Optional

class Config:
    # REST API base URL
    REST_API_BASE_URL: str = os.getenv("REST_API_BASE_URL", "http://localhost:3000")
    
    # Server configuration
    PORT: int = int(os.getenv("PORT", "3001"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # HTTP client configuration
    HTTP_TIMEOUT: int = 5
    HTTP_MAX_REDIRECTS: int = 5

config = Config()
