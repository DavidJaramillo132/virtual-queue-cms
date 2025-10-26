import httpx
from typing import Any, Dict, List, Optional
from config import config

class HTTPClient:
    def __init__(self):
        self.base_url = config.REST_API_BASE_URL
        self.timeout = config.HTTP_TIMEOUT
        
    async def get(self, endpoint: str) -> Any:
        """Make a GET request to the REST API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(f"{self.base_url}{endpoint}")
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"HTTP error occurred: {e}")
                raise
            except Exception as e:
                print(f"An error occurred: {e}")
                raise
    
    async def post(self, endpoint: str, data: Dict[str, Any]) -> Any:
        """Make a POST request to the REST API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(f"{self.base_url}{endpoint}", json=data)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"HTTP error occurred: {e}")
                raise
            except Exception as e:
                print(f"An error occurred: {e}")
                raise

# Singleton instance
http_client = HTTPClient()
