"""
Controladores/Routers de la API.
"""
from app.controladores.pagos import router as pagos_router
from app.controladores.partners import router as partners_router
from app.controladores.webhooks import router as webhooks_router
from app.controladores.suscripciones import router as suscripciones_router
from app.controladores.cola import router as cola_router
from app.controladores.config import router as config_router
from app.controladores.descuentos import router as descuentos_router

__all__ = [
    "pagos_router",
    "partners_router", 
    "webhooks_router",
    "suscripciones_router",
    "cola_router",
    "config_router",
    "descuentos_router"
]
