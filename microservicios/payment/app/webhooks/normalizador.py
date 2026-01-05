"""
Normalizador de webhooks de diferentes pasarelas.
"""
from typing import Dict, Any
from datetime import datetime

from app.modelos.partner import TipoEvento
from app.modelos.webhook import WebhookEventoInterno
from app.adaptador import obtener_adaptador


class NormalizadorWebhooks:
    """
    Normaliza webhooks de diferentes pasarelas a un formato interno comun.
    """
    
    @staticmethod
    def normalizar(
        pasarela: str,
        payload: Dict[str, Any]
    ) -> WebhookEventoInterno:
        """
        Normaliza un webhook de cualquier pasarela.
        
        Args:
            pasarela: Nombre de la pasarela (stripe, mercadopago, mock)
            payload: Payload original del webhook
            
        Returns:
            WebhookEventoInterno con formato normalizado
        """
        adaptador = obtener_adaptador(pasarela)
        datos_normalizados = adaptador.normalizar_webhook(payload)
        
        return WebhookEventoInterno(
            id=datos_normalizados.get("id", ""),
            tipo=TipoEvento(datos_normalizados.get("tipo", TipoEvento.EXTERNAL_SERVICE.value)),
            pasarela=pasarela,
            evento_original=datos_normalizados.get("evento_original", "unknown"),
            datos=datos_normalizados.get("datos", {}),
            timestamp=datetime.fromisoformat(datos_normalizados.get("timestamp", datetime.utcnow().isoformat()))
        )
    
    @staticmethod
    def normalizar_externo(
        origen: str,
        tipo_evento: str,
        datos: Dict[str, Any]
    ) -> WebhookEventoInterno:
        """
        Normaliza un webhook de un partner externo.
        
        Args:
            origen: Sistema origen del webhook
            tipo_evento: Tipo de evento
            datos: Datos del evento
            
        Returns:
            WebhookEventoInterno normalizado
        """
        # Intentar mapear a un TipoEvento conocido
        try:
            tipo = TipoEvento(tipo_evento)
        except ValueError:
            tipo = TipoEvento.EXTERNAL_SERVICE
        
        return WebhookEventoInterno(
            id=datos.get("evento_id", datos.get("id", "")),
            tipo=tipo,
            pasarela="externo",
            evento_original=tipo_evento,
            datos=datos,
            timestamp=datetime.utcnow()
        )
