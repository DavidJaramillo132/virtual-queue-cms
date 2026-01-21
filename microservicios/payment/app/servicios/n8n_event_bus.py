"""
Cliente para el Event Bus de n8n.
Envia eventos normalizados a n8n para orquestacion centralizada.
"""
import httpx
import os
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime

from app.webhooks.normalizador import EventoNormalizado
from app.config import configuracion


class N8NEventBusClient:
    """
    Cliente para enviar eventos al Event Bus de n8n.
    Implementa retry logic y fallback en caso de falla.
    """
    
    def __init__(self):
        self.webhook_url = os.getenv(
            'N8N_WEBHOOK_URL',
            'http://n8n:5678/webhook/payment-webhook'
        )
        self.timeout = float(os.getenv('N8N_TIMEOUT', '10.0'))
        self.max_retries = int(os.getenv('N8N_MAX_RETRIES', '3'))
        self.retry_delay = float(os.getenv('N8N_RETRY_DELAY', '2.0'))
    
    async def enviar_evento(
        self,
        evento: EventoNormalizado,
        partner_webhook_url: Optional[str] = None,
        partner_signature: Optional[str] = None
    ) -> bool:
        """
        Envia un evento normalizado al Event Bus de n8n.
        
        Args:
            evento: Evento normalizado a enviar
            partner_webhook_url: URL del webhook del partner (opcional)
            partner_signature: Firma HMAC para el partner (opcional)
            
        Returns:
            True si el envio fue exitoso, False en caso contrario
        """
        payload = evento.to_dict()
        
        # Agregar informacion de partner si existe
        if partner_webhook_url:
            payload["partner_webhook_url"] = partner_webhook_url
        if partner_signature:
            payload["partner_signature"] = partner_signature
        
        # Intentar enviar con retries
        for intento in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        self.webhook_url,
                        json=payload,
                        headers={
                            'Content-Type': 'application/json',
                            'X-Event-Source': 'payment-service',
                            'X-Event-Type': evento.event_type.value,
                            'X-Provider': evento.provider
                        }
                    )
                    
                    if response.status_code in [200, 201, 202]:
                        print(f"✅ Evento enviado a n8n: {evento.event_type.value} - {evento.payment_id}")
                        return True
                    else:
                        print(f"⚠️ n8n respondió con status {response.status_code}: {response.text}")
                        
            except httpx.TimeoutException:
                print(f"⏱️ Timeout enviando a n8n (intento {intento + 1}/{self.max_retries})")
            except httpx.ConnectError:
                print(f"🔌 Error de conexión con n8n (intento {intento + 1}/{self.max_retries})")
            except Exception as e:
                print(f"❌ Error inesperado enviando a n8n: {e}")
            
            # Esperar antes de reintentar
            if intento < self.max_retries - 1:
                await asyncio.sleep(self.retry_delay * (intento + 1))
        
        print(f"🚨 Falló envío a n8n después de {self.max_retries} intentos")
        return False
    
    async def enviar_evento_con_fallback(
        self,
        evento: EventoNormalizado,
        fallback_callback: Optional[callable] = None
    ) -> bool:
        """
        Envia evento a n8n con fallback en caso de falla.
        
        Args:
            evento: Evento a enviar
            fallback_callback: Función async a ejecutar si n8n falla
            
        Returns:
            True si el envio o fallback fue exitoso
        """
        success = await self.enviar_evento(evento)
        
        if not success and fallback_callback:
            print(f"🔄 Ejecutando fallback para {evento.event_type.value}")
            try:
                await fallback_callback(evento)
                return True
            except Exception as e:
                print(f"❌ Error en fallback: {e}")
                return False
        
        return success
    
    async def health_check(self) -> bool:
        """
        Verifica si n8n está disponible.
        
        Returns:
            True si n8n responde, False en caso contrario
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Intentar hacer un health check al endpoint de n8n
                health_url = self.webhook_url.replace('/webhook/payment-webhook', '/healthz')
                response = await client.get(health_url)
                return response.status_code == 200
        except:
            return False


# Singleton global
_n8n_client = None

def get_n8n_client() -> N8NEventBusClient:
    """Obtiene la instancia singleton del cliente n8n."""
    global _n8n_client
    if _n8n_client is None:
        _n8n_client = N8NEventBusClient()
    return _n8n_client
