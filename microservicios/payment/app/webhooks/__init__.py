"""
Modulo de webhooks y procesamiento de eventos.
"""
from app.webhooks.procesador import ProcesadorWebhooks
from app.webhooks.normalizador import NormalizadorWebhooks

__all__ = [
    "ProcesadorWebhooks",
    "NormalizadorWebhooks"
]
