"""
Factory para obtener el adaptador de pago correcto.
"""
from typing import Dict, Type

from app.adaptador.base import ProveedorPagoBase
from app.adaptador.mock_adapter import MockAdapter
from app.adaptador.stripe_adapter import StripeAdapter
from app.adaptador.mercadopago_adapter import MercadoPagoAdapter
from app.config import configuracion


class AdaptadorFactory:
    """
    Factory para crear instancias de adaptadores de pago.
    Implementa el patron Factory para seleccionar el adaptador correcto.
    """
    
    _adaptadores: Dict[str, Type[ProveedorPagoBase]] = {
        "mock": MockAdapter,
        "stripe": StripeAdapter,
        "mercadopago": MercadoPagoAdapter
    }
    
    _instancias: Dict[str, ProveedorPagoBase] = {}
    
    @classmethod
    def obtener(cls, nombre: str = None) -> ProveedorPagoBase:
        """
        Obtiene una instancia del adaptador solicitado.
        Usa singleton para reutilizar instancias.
        
        Args:
            nombre: Nombre del adaptador. Si es None, usa el configurado.
            
        Returns:
            Instancia del adaptador de pago
            
        Raises:
            ValueError: Si el adaptador no existe
        """
        nombre_adaptador = nombre or configuracion.PASARELA_ACTIVA
        
        if nombre_adaptador not in cls._adaptadores:
            raise ValueError(
                f"Adaptador '{nombre_adaptador}' no disponible. "
                f"Opciones: {list(cls._adaptadores.keys())}"
            )
        
        if nombre_adaptador not in cls._instancias:
            cls._instancias[nombre_adaptador] = cls._adaptadores[nombre_adaptador]()
        
        return cls._instancias[nombre_adaptador]
    
    @classmethod
    def registrar(cls, nombre: str, adaptador: Type[ProveedorPagoBase]) -> None:
        """
        Registra un nuevo adaptador en la factory.
        Util para extensiones o testing.
        
        Args:
            nombre: Nombre del adaptador
            adaptador: Clase del adaptador
        """
        cls._adaptadores[nombre] = adaptador
    
    @classmethod
    def listar_disponibles(cls) -> list[str]:
        """Lista los adaptadores disponibles."""
        return list(cls._adaptadores.keys())
    
    @classmethod
    def limpiar_instancias(cls) -> None:
        """Limpia las instancias cacheadas (util para testing)."""
        cls._instancias.clear()


def obtener_adaptador(nombre: str = None) -> ProveedorPagoBase:
    """
    Funcion helper para obtener un adaptador.
    
    Args:
        nombre: Nombre del adaptador (opcional)
        
    Returns:
        Instancia del adaptador de pago
    """
    return AdaptadorFactory.obtener(nombre)
