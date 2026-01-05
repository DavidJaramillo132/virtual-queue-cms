"""
Adaptadores de pasarelas de pago.
Implementan el patron Adapter para abstraer las diferentes pasarelas.
"""
from app.adaptador.base import ProveedorPagoBase, ResultadoPago, ResultadoReembolso
from app.adaptador.mock_adapter import MockAdapter
from app.adaptador.stripe_adapter import StripeAdapter
from app.adaptador.mercadopago_adapter import MercadoPagoAdapter
from app.adaptador.factory import obtener_adaptador, AdaptadorFactory

__all__ = [
    "ProveedorPagoBase",
    "ResultadoPago",
    "ResultadoReembolso",
    "MockAdapter",
    "StripeAdapter",
    "MercadoPagoAdapter",
    "obtener_adaptador",
    "AdaptadorFactory"
]
