"""
Configuracion del microservicio de pagos.
Centraliza todas las variables de entorno y configuraciones.
"""
import os
from typing import Optional


class Configuracion:
    """Clase de configuracion para el microservicio de pagos."""
    
    # Configuracion general
    NOMBRE_SERVICIO: str = "payment-service"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # URLs de servicios
    REST_API_URL: str = os.getenv("REST_API_URL", "http://rest-typescript:3000")
    GRAPHQL_URL: str = os.getenv("GRAPHQL_URL", "http://graphql-service:5000/graphql")
    
    # Configuracion de pasarelas de pago
    PASARELA_ACTIVA: str = os.getenv("PASARELA_ACTIVA", "mock")  # mock, stripe, mercadopago
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_PUBLISHABLE_KEY: Optional[str] = os.getenv("STRIPE_PUBLISHABLE_KEY")
    
    # MercadoPago
    MERCADOPAGO_ACCESS_TOKEN: Optional[str] = os.getenv("MERCADOPAGO_ACCESS_TOKEN")
    MERCADOPAGO_WEBHOOK_SECRET: Optional[str] = os.getenv("MERCADOPAGO_WEBHOOK_SECRET")
    
    # Configuracion de suscripciones
    PRECIO_SUSCRIPCION_MENSUAL: float = float(os.getenv("PRECIO_SUSCRIPCION_MENSUAL", "29.99"))
    DIAS_PRUEBA_GRATIS: int = int(os.getenv("DIAS_PRUEBA_GRATIS", "7"))
    
    # Configuracion de webhooks
    WEBHOOK_TIMEOUT: int = int(os.getenv("WEBHOOK_TIMEOUT", "30"))
    WEBHOOK_REINTENTOS: int = int(os.getenv("WEBHOOK_REINTENTOS", "3"))
    
    # URL de pagina externa (para recibir/enviar informacion)
    EXTERNAL_PAGE_URL: Optional[str] = os.getenv("EXTERNAL_PAGE_URL")
    
    # Secreto para HMAC (DEBE configurarse en produccion)
    HMAC_SECRET_GLOBAL: str = os.getenv("HMAC_SECRET_GLOBAL", "secreto_desarrollo_cambiar_en_produccion")
    
    # Love4Pets Partner (configuración B2B)
    LOVE4PETS_PARTNER_ID: Optional[str] = os.getenv("LOVE4PETS_PARTNER_ID")
    LOVE4PETS_HMAC_SECRET: Optional[str] = os.getenv("LOVE4PETS_HMAC_SECRET")
    
    @classmethod
    def validar_secreto_hmac(cls) -> None:
        """Valida que el secreto HMAC no sea el valor por defecto en produccion."""
        if not cls.DEBUG and cls.HMAC_SECRET_GLOBAL == "secreto_desarrollo_cambiar_en_produccion":
            raise ValueError(
                "HMAC_SECRET_GLOBAL debe configurarse en produccion. "
                "No usar el valor por defecto."
            )
    
    @classmethod
    def validar(cls) -> None:
        """Valida que la configuracion sea correcta."""
        if cls.PASARELA_ACTIVA == "stripe" and not cls.STRIPE_SECRET_KEY:
            raise ValueError("STRIPE_SECRET_KEY es requerido cuando la pasarela es Stripe")
        if cls.PASARELA_ACTIVA == "mercadopago" and not cls.MERCADOPAGO_ACCESS_TOKEN:
            raise ValueError("MERCADOPAGO_ACCESS_TOKEN es requerido cuando la pasarela es MercadoPago")
        
        # Validar secreto HMAC en produccion
        if not cls.DEBUG:
            cls.validar_secreto_hmac()
    
    @classmethod
    def obtener_info(cls) -> dict:
        """Retorna informacion de configuracion (sin secretos)."""
        return {
            "nombre_servicio": cls.NOMBRE_SERVICIO,
            "version": cls.VERSION,
            "debug": cls.DEBUG,
            "pasarela_activa": cls.PASARELA_ACTIVA,
            "precio_suscripcion": cls.PRECIO_SUSCRIPCION_MENSUAL,
            "dias_prueba": cls.DIAS_PRUEBA_GRATIS,
            "stripe_configurado": bool(cls.STRIPE_SECRET_KEY),
            "mercadopago_configurado": bool(cls.MERCADOPAGO_ACCESS_TOKEN)
        }


configuracion = Configuracion()
