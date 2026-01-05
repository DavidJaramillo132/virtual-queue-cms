"""
Adaptador Mock para desarrollo y pruebas.
Simula una pasarela de pago sin conexion real.
"""
import uuid
import hmac
import hashlib
import json
from datetime import datetime
from typing import Optional, Dict, Any

from app.adaptador.base import ProveedorPagoBase, ResultadoPago, ResultadoReembolso
from app.modelos.pago import EstadoPago
from app.modelos.partner import TipoEvento


class MockAdapter(ProveedorPagoBase):
    """
    Adaptador de prueba para desarrollo.
    Simula todas las operaciones sin conexion real a una pasarela.
    """
    
    # Almacenamiento en memoria para pruebas
    _pagos: Dict[str, Dict[str, Any]] = {}
    _suscripciones: Dict[str, Dict[str, Any]] = {}
    
    @property
    def nombre(self) -> str:
        return "mock"
    
    async def crear_pago(
        self,
        monto: float,
        moneda: str,
        descripcion: str,
        metadatos: Optional[Dict[str, Any]] = None,
        url_retorno: Optional[str] = None,
        url_cancelacion: Optional[str] = None
    ) -> ResultadoPago:
        """Simula la creacion de un pago."""
        id_transaccion = f"mock_pay_{uuid.uuid4().hex[:12]}"
        
        pago_data = {
            "id": id_transaccion,
            "monto": monto,
            "moneda": moneda,
            "descripcion": descripcion,
            "estado": EstadoPago.COMPLETADO,
            "metadatos": metadatos or {},
            "creado_en": datetime.utcnow().isoformat()
        }
        self._pagos[id_transaccion] = pago_data
        
        return ResultadoPago(
            exitoso=True,
            id_transaccion=id_transaccion,
            id_externo=id_transaccion,
            estado=EstadoPago.COMPLETADO,
            url_checkout=f"https://mock-checkout.local/pay/{id_transaccion}",
            monto=monto,
            moneda=moneda,
            mensaje="Pago simulado creado exitosamente",
            metadatos=pago_data
        )
    
    async def verificar_pago(self, id_transaccion: str) -> ResultadoPago:
        """Verifica el estado de un pago simulado."""
        pago = self._pagos.get(id_transaccion)
        
        if not pago:
            return ResultadoPago(
                exitoso=False,
                id_transaccion=id_transaccion,
                estado=EstadoPago.FALLIDO,
                error="Pago no encontrado"
            )
        
        return ResultadoPago(
            exitoso=True,
            id_transaccion=id_transaccion,
            id_externo=pago["id"],
            estado=pago["estado"],
            monto=pago["monto"],
            moneda=pago["moneda"],
            metadatos=pago
        )
    
    async def procesar_reembolso(
        self,
        id_transaccion: str,
        monto: Optional[float] = None,
        razon: Optional[str] = None
    ) -> ResultadoReembolso:
        """Simula un reembolso."""
        pago = self._pagos.get(id_transaccion)
        
        if not pago:
            return ResultadoReembolso(
                exitoso=False,
                id_pago_original=id_transaccion,
                error="Pago no encontrado"
            )
        
        monto_reembolso = monto or pago["monto"]
        id_reembolso = f"mock_ref_{uuid.uuid4().hex[:12]}"
        
        # Actualizar estado del pago
        pago["estado"] = EstadoPago.REEMBOLSADO
        
        return ResultadoReembolso(
            exitoso=True,
            id_reembolso=id_reembolso,
            id_pago_original=id_transaccion,
            monto=monto_reembolso,
            estado=EstadoPago.REEMBOLSADO,
            mensaje=f"Reembolso simulado por: {razon or 'Sin razon especificada'}"
        )
    
    async def crear_suscripcion(
        self,
        precio: float,
        moneda: str,
        intervalo: str,
        metadatos: Optional[Dict[str, Any]] = None
    ) -> ResultadoPago:
        """Simula la creacion de una suscripcion."""
        id_suscripcion = f"mock_sub_{uuid.uuid4().hex[:12]}"
        
        suscripcion_data = {
            "id": id_suscripcion,
            "precio": precio,
            "moneda": moneda,
            "intervalo": intervalo,
            "estado": "activa",
            "metadatos": metadatos or {},
            "creado_en": datetime.utcnow().isoformat()
        }
        self._suscripciones[id_suscripcion] = suscripcion_data
        
        return ResultadoPago(
            exitoso=True,
            id_transaccion=id_suscripcion,
            id_externo=id_suscripcion,
            estado=EstadoPago.COMPLETADO,
            monto=precio,
            moneda=moneda,
            mensaje="Suscripcion simulada creada exitosamente",
            metadatos=suscripcion_data
        )
    
    async def cancelar_suscripcion(
        self,
        id_suscripcion: str,
        inmediatamente: bool = False
    ) -> ResultadoPago:
        """Simula la cancelacion de una suscripcion."""
        suscripcion = self._suscripciones.get(id_suscripcion)
        
        if not suscripcion:
            return ResultadoPago(
                exitoso=False,
                id_transaccion=id_suscripcion,
                estado=EstadoPago.FALLIDO,
                error="Suscripcion no encontrada"
            )
        
        suscripcion["estado"] = "cancelada"
        suscripcion["cancelacion_inmediata"] = inmediatamente
        
        return ResultadoPago(
            exitoso=True,
            id_transaccion=id_suscripcion,
            estado=EstadoPago.CANCELADO,
            mensaje="Suscripcion cancelada" + (" inmediatamente" if inmediatamente else " al final del periodo")
        )
    
    def normalizar_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza un webhook simulado."""
        tipo_evento = payload.get("tipo", payload.get("type", "unknown"))
        
        # Mapeo de eventos mock a eventos internos
        mapeo_eventos = {
            "payment.completed": TipoEvento.PAYMENT_SUCCESS,
            "payment.failed": TipoEvento.PAYMENT_FAILED,
            "subscription.created": TipoEvento.SUBSCRIPTION_CREATED,
            "subscription.cancelled": TipoEvento.SUBSCRIPTION_CANCELLED,
            "booking.confirmed": TipoEvento.BOOKING_CONFIRMED
        }
        
        tipo_normalizado = mapeo_eventos.get(tipo_evento, TipoEvento.EXTERNAL_SERVICE)
        
        return {
            "id": payload.get("id", f"mock_evt_{uuid.uuid4().hex[:8]}"),
            "tipo": tipo_normalizado.value if isinstance(tipo_normalizado, TipoEvento) else tipo_normalizado,
            "pasarela": "mock",
            "evento_original": tipo_evento,
            "datos": payload.get("data", payload.get("datos", {})),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def verificar_firma_webhook(
        self,
        payload: bytes,
        firma: str,
        secreto: str
    ) -> bool:
        """Verifica la firma HMAC de un webhook."""
        firma_calculada = hmac.new(
            secreto.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(firma_calculada, firma)
    
    @classmethod
    def generar_webhook_prueba(
        cls,
        tipo_evento: str,
        datos: Dict[str, Any],
        secreto: str
    ) -> tuple[Dict[str, Any], str]:
        """
        Genera un webhook de prueba con firma HMAC.
        Util para testing de integraciones.
        
        Returns:
            Tupla con (payload, firma_hmac)
        """
        payload = {
            "id": f"mock_evt_{uuid.uuid4().hex[:8]}",
            "tipo": tipo_evento,
            "data": datos,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        payload_bytes = json.dumps(payload, sort_keys=True).encode()
        firma = hmac.new(secreto.encode(), payload_bytes, hashlib.sha256).hexdigest()
        
        return payload, firma
