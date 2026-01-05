"""
Utilidades de autenticacion HMAC para webhooks.
"""
import hmac
import hashlib
import secrets
import time
from typing import Optional
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import configuracion


def generar_secreto(longitud: int = 32) -> str:
    """
    Genera un secreto aleatorio seguro para HMAC.
    
    Args:
        longitud: Longitud del secreto en bytes
        
    Returns:
        Secreto en formato hexadecimal
    """
    return f"whsec_{secrets.token_hex(longitud)}"


def generar_firma_hmac(
    payload: bytes,
    secreto: str,
    timestamp: Optional[int] = None
) -> tuple[str, int]:
    """
    Genera una firma HMAC-SHA256 para un payload.
    
    Args:
        payload: Datos a firmar en bytes
        secreto: Secreto compartido
        timestamp: Timestamp opcional (se genera si no se proporciona)
        
    Returns:
        Tupla con (firma_hexadecimal, timestamp)
    """
    ts = timestamp or int(time.time())
    
    # Concatenar timestamp con payload para prevenir ataques de replay
    mensaje = f"{ts}.".encode() + payload
    
    firma = hmac.new(
        secreto.encode(),
        mensaje,
        hashlib.sha256
    ).hexdigest()
    
    return firma, ts


def verificar_firma_hmac(
    payload: bytes,
    firma: str,
    secreto: str,
    timestamp: int,
    tolerancia_segundos: int = 300
) -> bool:
    """
    Verifica una firma HMAC-SHA256.
    
    Args:
        payload: Datos firmados en bytes
        firma: Firma a verificar
        secreto: Secreto compartido
        timestamp: Timestamp del mensaje
        tolerancia_segundos: Tolerancia para ataques de replay (default 5 min)
        
    Returns:
        True si la firma es valida y el timestamp esta dentro de la tolerancia
    """
    # Verificar que el timestamp este dentro de la tolerancia
    tiempo_actual = int(time.time())
    if abs(tiempo_actual - timestamp) > tolerancia_segundos:
        return False
    
    # Calcular firma esperada
    mensaje = f"{timestamp}.".encode() + payload
    firma_esperada = hmac.new(
        secreto.encode(),
        mensaje,
        hashlib.sha256
    ).hexdigest()
    
    # Comparacion segura contra timing attacks
    return hmac.compare_digest(firma_esperada, firma)


def construir_cabecera_firma(firma: str, timestamp: int) -> str:
    """
    Construye la cabecera de firma en formato estandar.
    
    Args:
        firma: Firma HMAC
        timestamp: Timestamp usado
        
    Returns:
        Cabecera formateada: "t=timestamp,v1=firma"
    """
    return f"t={timestamp},v1={firma}"


def parsear_cabecera_firma(cabecera: str) -> tuple[Optional[str], Optional[int]]:
    """
    Parsea una cabecera de firma.
    
    Args:
        cabecera: Cabecera en formato "t=timestamp,v1=firma"
        
    Returns:
        Tupla con (firma, timestamp) o (None, None) si es invalida
    """
    try:
        partes = dict(p.split("=", 1) for p in cabecera.split(","))
        return partes.get("v1"), int(partes.get("t", 0))
    except (ValueError, AttributeError):
        return None, None


class HMACMiddleware(BaseHTTPMiddleware):
    """
    Middleware para verificar firmas HMAC en webhooks entrantes.
    Solo se aplica a rutas especificas.
    """
    
    def __init__(
        self,
        app,
        rutas_protegidas: list[str] = None,
        cabecera_firma: str = "X-Webhook-Signature",
        cabecera_timestamp: str = "X-Webhook-Timestamp"
    ):
        super().__init__(app)
        self.rutas_protegidas = rutas_protegidas or ["/webhooks/external"]
        self.cabecera_firma = cabecera_firma
        self.cabecera_timestamp = cabecera_timestamp
    
    async def dispatch(self, request: Request, call_next):
        # Solo verificar rutas protegidas
        ruta_actual = request.url.path
        
        requiere_verificacion = any(
            ruta_actual.startswith(ruta) 
            for ruta in self.rutas_protegidas
        )
        
        if not requiere_verificacion:
            return await call_next(request)
        
        # Obtener cabeceras de firma
        firma = request.headers.get(self.cabecera_firma)
        timestamp_str = request.headers.get(self.cabecera_timestamp)
        
        if not firma or not timestamp_str:
            raise HTTPException(
                status_code=401,
                detail="Cabeceras de firma HMAC requeridas"
            )
        
        try:
            timestamp = int(timestamp_str)
        except ValueError:
            raise HTTPException(
                status_code=401,
                detail="Timestamp invalido"
            )
        
        # Leer body
        body = await request.body()
        
        # Obtener partner_id del path o header para buscar su secreto
        partner_id = request.headers.get("X-Partner-ID")
        
        # Por ahora usamos el secreto global, en produccion
        # se buscaria el secreto especifico del partner
        secreto = configuracion.HMAC_SECRET_GLOBAL
        
        if not verificar_firma_hmac(body, firma, secreto, timestamp):
            raise HTTPException(
                status_code=401,
                detail="Firma HMAC invalida"
            )
        
        return await call_next(request)
