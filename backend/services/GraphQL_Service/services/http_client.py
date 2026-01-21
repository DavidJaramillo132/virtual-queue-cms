import httpx
from typing import Any, Dict, Optional
from config import config
import logging

logger = logging.getLogger(__name__)


class HTTPClient:
    def __init__(self):
        self.base_url = config.REST_API_BASE_URL
        self.timeout = config.HTTP_TIMEOUT

    async def get(self, endpoint: str, headers: Optional[Dict[str, str]] = None) -> Any:
        """Make a GET request to the REST API. Optional headers can be provided (e.g. Authorization)."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                if headers:
                    auth_header = headers.get("Authorization", "")
                    if auth_header:
                        logger.info(f"Reenviando Authorization a REST API: {endpoint} - {auth_header[:20]}...")
                
                response = await client.get(f"{self.base_url}{endpoint}", headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"HTTP error en GET {endpoint}: {e}")
                raise
            except Exception as e:
                logger.error(f"Error en GET {endpoint}: {e}")
                raise

    async def post(self, endpoint: str, data: Dict[str, Any], headers: Optional[Dict[str, str]] = None) -> Any:
        """Make a POST request to the REST API. Optional headers can be provided (e.g. Authorization)."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                if headers:
                    auth_header = headers.get("Authorization", "")
                    if auth_header:
                        logger.info(f"Reenviando Authorization a REST API: {endpoint} - {auth_header[:20]}...")
                
                response = await client.post(f"{self.base_url}{endpoint}", json=data, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"HTTP error en POST {endpoint}: {e}")
                raise
            except Exception as e:
                logger.error(f"Error en POST {endpoint}: {e}")
                raise


# Singleton instance
http_client = HTTPClient()
