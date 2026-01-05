"""
Interfaz base para proveedores de pago.
Define el contrato que todos los adaptadores deben implementar.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any

from app.modelos.pago import EstadoPago


@dataclass
class ResultadoPago:
    """Resultado de una operacion de pago."""
    exitoso: bool
    id_transaccion: Optional[str] = None
    id_externo: Optional[str] = None
    estado: EstadoPago = EstadoPago.PENDIENTE
    url_checkout: Optional[str] = None
    monto: float = 0.0
    moneda: str = "USD"
    mensaje: Optional[str] = None
    error: Optional[str] = None
    metadatos: Optional[Dict[str, Any]] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
        if self.metadatos is None:
            self.metadatos = {}


@dataclass
class ResultadoReembolso:
    """Resultado de una operacion de reembolso."""
    exitoso: bool
    id_reembolso: Optional[str] = None
    id_pago_original: Optional[str] = None
    monto: float = 0.0
    estado: EstadoPago = EstadoPago.PENDIENTE
    mensaje: Optional[str] = None
    error: Optional[str] = None


class ProveedorPagoBase(ABC):
    """
    Interfaz abstracta para proveedores de pago.
    Todos los adaptadores deben implementar estos metodos.
    """
    
    @property
    @abstractmethod
    def nombre(self) -> str:
        """Nombre del proveedor de pago."""
        pass
    
    @abstractmethod
    async def crear_pago(
        self,
        monto: float,
        moneda: str,
        descripcion: str,
        metadatos: Optional[Dict[str, Any]] = None,
        url_retorno: Optional[str] = None,
        url_cancelacion: Optional[str] = None
    ) -> ResultadoPago:
        """
        Crea un nuevo pago en la pasarela.
        
        Args:
            monto: Monto del pago
            moneda: Codigo de moneda ISO 4217
            descripcion: Descripcion del pago
            metadatos: Datos adicionales
            url_retorno: URL de redireccion despues del pago exitoso
            url_cancelacion: URL de redireccion si se cancela
            
        Returns:
            ResultadoPago con la informacion del pago creado
        """
        pass
    
    @abstractmethod
    async def verificar_pago(self, id_transaccion: str) -> ResultadoPago:
        """
        Verifica el estado de un pago.
        
        Args:
            id_transaccion: ID de la transaccion a verificar
            
        Returns:
            ResultadoPago con el estado actual
        """
        pass
    
    @abstractmethod
    async def procesar_reembolso(
        self,
        id_transaccion: str,
        monto: Optional[float] = None,
        razon: Optional[str] = None
    ) -> ResultadoReembolso:
        """
        Procesa un reembolso total o parcial.
        
        Args:
            id_transaccion: ID de la transaccion a reembolsar
            monto: Monto a reembolsar (None = total)
            razon: Razon del reembolso
            
        Returns:
            ResultadoReembolso con la informacion del reembolso
        """
        pass
    
    @abstractmethod
    async def crear_suscripcion(
        self,
        precio: float,
        moneda: str,
        intervalo: str,
        metadatos: Optional[Dict[str, Any]] = None
    ) -> ResultadoPago:
        """
        Crea una suscripcion recurrente.
        
        Args:
            precio: Precio de la suscripcion
            moneda: Codigo de moneda
            intervalo: Intervalo de cobro (mensual, anual, etc)
            metadatos: Datos adicionales
            
        Returns:
            ResultadoPago con informacion de la suscripcion
        """
        pass
    
    @abstractmethod
    async def cancelar_suscripcion(
        self,
        id_suscripcion: str,
        inmediatamente: bool = False
    ) -> ResultadoPago:
        """
        Cancela una suscripcion.
        
        Args:
            id_suscripcion: ID de la suscripcion
            inmediatamente: Si cancela al instante o al final del periodo
            
        Returns:
            ResultadoPago con el resultado de la cancelacion
        """
        pass
    
    @abstractmethod
    def normalizar_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normaliza un webhook de la pasarela al formato interno.
        
        Args:
            payload: Payload original del webhook
            
        Returns:
            Diccionario con el formato normalizado
        """
        pass
    
    @abstractmethod
    def verificar_firma_webhook(
        self,
        payload: bytes,
        firma: str,
        secreto: str
    ) -> bool:
        """
        Verifica la firma de un webhook.
        
        Args:
            payload: Cuerpo del webhook en bytes
            firma: Firma proporcionada
            secreto: Secreto para verificar
            
        Returns:
            True si la firma es valida
        """
        pass
