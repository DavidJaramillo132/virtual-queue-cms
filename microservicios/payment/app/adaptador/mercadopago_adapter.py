"""
Adaptador para MercadoPago.
Implementa la integracion con la pasarela de pago MercadoPago.
"""
import hmac
import hashlib
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

from app.adaptador.base import ProveedorPagoBase, ResultadoPago, ResultadoReembolso
from app.modelos.pago import EstadoPago
from app.modelos.partner import TipoEvento
from app.config import configuracion


class MercadoPagoAdapter(ProveedorPagoBase):
    """
    Adaptador para la pasarela de pago MercadoPago.
    Requiere configurar MERCADOPAGO_ACCESS_TOKEN en las variables de entorno.
    """
    
    def __init__(self):
        self._sdk = None
        self._inicializado = False
    
    def _inicializar_sdk(self) -> bool:
        """Inicializa el SDK de MercadoPago si no esta inicializado."""
        if self._inicializado:
            return True
            
        if not configuracion.MERCADOPAGO_ACCESS_TOKEN:
            return False
            
        try:
            import mercadopago
            self._sdk = mercadopago.SDK(configuracion.MERCADOPAGO_ACCESS_TOKEN)
            self._inicializado = True
            return True
        except ImportError:
            return False
    
    @property
    def nombre(self) -> str:
        return "mercadopago"
    
    async def crear_pago(
        self,
        monto: float,
        moneda: str,
        descripcion: str,
        metadatos: Optional[Dict[str, Any]] = None,
        url_retorno: Optional[str] = None,
        url_cancelacion: Optional[str] = None
    ) -> ResultadoPago:
        """Crea una preferencia de pago en MercadoPago."""
        if not self._inicializar_sdk():
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error="MercadoPago no esta configurado correctamente"
            )
        
        try:
            preferencia = {
                "items": [
                    {
                        "title": descripcion,
                        "quantity": 1,
                        "unit_price": monto,
                        "currency_id": moneda
                    }
                ],
                "back_urls": {
                    "success": url_retorno or "https://localhost/success",
                    "failure": url_cancelacion or "https://localhost/failure",
                    "pending": url_retorno or "https://localhost/pending"
                },
                "auto_return": "approved",
                "external_reference": metadatos.get("referencia") if metadatos else str(uuid.uuid4()),
                "metadata": metadatos or {}
            }
            
            resultado = self._sdk.preference().create(preferencia)
            respuesta = resultado.get("response", {})
            
            if resultado.get("status") in [200, 201]:
                return ResultadoPago(
                    exitoso=True,
                    id_transaccion=respuesta.get("id"),
                    id_externo=respuesta.get("id"),
                    estado=EstadoPago.PENDIENTE,
                    url_checkout=respuesta.get("init_point"),
                    monto=monto,
                    moneda=moneda,
                    mensaje="Preferencia de pago creada",
                    metadatos={"preference_id": respuesta.get("id")}
                )
            else:
                return ResultadoPago(
                    exitoso=False,
                    estado=EstadoPago.FALLIDO,
                    error=respuesta.get("message", "Error desconocido")
                )
                
        except Exception as e:
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error=str(e)
            )
    
    async def verificar_pago(self, id_transaccion: str) -> ResultadoPago:
        """Verifica el estado de un pago en MercadoPago."""
        if not self._inicializar_sdk():
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error="MercadoPago no esta configurado"
            )
        
        try:
            resultado = self._sdk.payment().get(id_transaccion)
            respuesta = resultado.get("response", {})
            
            if resultado.get("status") == 200:
                estado = self._mapear_estado(respuesta.get("status", ""))
                return ResultadoPago(
                    exitoso=True,
                    id_transaccion=id_transaccion,
                    id_externo=str(respuesta.get("id")),
                    estado=estado,
                    monto=respuesta.get("transaction_amount", 0),
                    moneda=respuesta.get("currency_id", "USD")
                )
            else:
                return ResultadoPago(
                    exitoso=False,
                    id_transaccion=id_transaccion,
                    estado=EstadoPago.FALLIDO,
                    error="Pago no encontrado"
                )
                
        except Exception as e:
            return ResultadoPago(
                exitoso=False,
                id_transaccion=id_transaccion,
                estado=EstadoPago.FALLIDO,
                error=str(e)
            )
    
    async def procesar_reembolso(
        self,
        id_transaccion: str,
        monto: Optional[float] = None,
        razon: Optional[str] = None
    ) -> ResultadoReembolso:
        """Procesa un reembolso en MercadoPago."""
        if not self._inicializar_sdk():
            return ResultadoReembolso(
                exitoso=False,
                error="MercadoPago no esta configurado"
            )
        
        try:
            datos_reembolso = {}
            if monto:
                datos_reembolso["amount"] = monto
            
            resultado = self._sdk.refund().create(id_transaccion, datos_reembolso)
            respuesta = resultado.get("response", {})
            
            if resultado.get("status") in [200, 201]:
                return ResultadoReembolso(
                    exitoso=True,
                    id_reembolso=str(respuesta.get("id")),
                    id_pago_original=id_transaccion,
                    monto=respuesta.get("amount", monto or 0),
                    estado=EstadoPago.REEMBOLSADO,
                    mensaje="Reembolso procesado exitosamente"
                )
            else:
                return ResultadoReembolso(
                    exitoso=False,
                    id_pago_original=id_transaccion,
                    error=respuesta.get("message", "Error al procesar reembolso")
                )
                
        except Exception as e:
            return ResultadoReembolso(
                exitoso=False,
                id_pago_original=id_transaccion,
                error=str(e)
            )
    
    async def crear_suscripcion(
        self,
        precio: float,
        moneda: str,
        intervalo: str,
        metadatos: Optional[Dict[str, Any]] = None
    ) -> ResultadoPago:
        """Crea un plan de suscripcion en MercadoPago."""
        if not self._inicializar_sdk():
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error="MercadoPago no esta configurado"
            )
        
        try:
            # MercadoPago usa preapproval para suscripciones
            plan = {
                "reason": "Suscripcion Premium Virtual Queue",
                "auto_recurring": {
                    "frequency": 1,
                    "frequency_type": "months" if intervalo == "mensual" else "years",
                    "transaction_amount": precio,
                    "currency_id": moneda
                },
                "back_url": metadatos.get("url_retorno", "https://localhost/subscription") if metadatos else "https://localhost/subscription"
            }
            
            resultado = self._sdk.preapproval().create(plan)
            respuesta = resultado.get("response", {})
            
            if resultado.get("status") in [200, 201]:
                return ResultadoPago(
                    exitoso=True,
                    id_transaccion=respuesta.get("id"),
                    id_externo=respuesta.get("id"),
                    estado=EstadoPago.PENDIENTE,
                    url_checkout=respuesta.get("init_point"),
                    monto=precio,
                    moneda=moneda,
                    mensaje="Plan de suscripcion creado",
                    metadatos={"preapproval_id": respuesta.get("id")}
                )
            else:
                return ResultadoPago(
                    exitoso=False,
                    estado=EstadoPago.FALLIDO,
                    error=respuesta.get("message", "Error al crear suscripcion")
                )
                
        except Exception as e:
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error=str(e)
            )
    
    async def cancelar_suscripcion(
        self,
        id_suscripcion: str,
        inmediatamente: bool = False
    ) -> ResultadoPago:
        """Cancela una suscripcion en MercadoPago."""
        if not self._inicializar_sdk():
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error="MercadoPago no esta configurado"
            )
        
        try:
            resultado = self._sdk.preapproval().update(
                id_suscripcion,
                {"status": "cancelled"}
            )
            
            if resultado.get("status") == 200:
                return ResultadoPago(
                    exitoso=True,
                    id_transaccion=id_suscripcion,
                    estado=EstadoPago.CANCELADO,
                    mensaje="Suscripcion cancelada"
                )
            else:
                return ResultadoPago(
                    exitoso=False,
                    id_transaccion=id_suscripcion,
                    estado=EstadoPago.FALLIDO,
                    error="Error al cancelar suscripcion"
                )
                
        except Exception as e:
            return ResultadoPago(
                exitoso=False,
                id_transaccion=id_suscripcion,
                estado=EstadoPago.FALLIDO,
                error=str(e)
            )
    
    def normalizar_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza un webhook de MercadoPago al formato interno."""
        tipo_evento = payload.get("type", payload.get("action", "unknown"))
        datos = payload.get("data", {})
        
        # Mapeo de eventos MercadoPago a eventos internos
        mapeo_eventos = {
            "payment": TipoEvento.PAYMENT_SUCCESS,
            "payment.created": TipoEvento.PAYMENT_SUCCESS,
            "payment.updated": TipoEvento.PAYMENT_SUCCESS,
            "plan": TipoEvento.SUBSCRIPTION_CREATED,
            "subscription_preapproval": TipoEvento.SUBSCRIPTION_CREATED,
            "subscription_authorized_payment": TipoEvento.SUBSCRIPTION_RENEWED
        }
        
        tipo_normalizado = mapeo_eventos.get(tipo_evento, TipoEvento.EXTERNAL_SERVICE)
        
        return {
            "id": payload.get("id", str(uuid.uuid4())),
            "tipo": tipo_normalizado.value,
            "pasarela": "mercadopago",
            "evento_original": tipo_evento,
            "datos": {
                "id_externo": datos.get("id"),
                "metadatos": payload.get("metadata", {})
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def verificar_firma_webhook(
        self,
        payload: bytes,
        firma: str,
        secreto: str
    ) -> bool:
        """Verifica la firma de un webhook de MercadoPago."""
        # MercadoPago usa un sistema diferente de verificacion
        # basado en headers x-signature y x-request-id
        try:
            firma_calculada = hmac.new(
                (secreto or configuracion.MERCADOPAGO_WEBHOOK_SECRET or "").encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(firma_calculada, firma)
        except Exception:
            return False
    
    def _mapear_estado(self, estado_mp: str) -> EstadoPago:
        """Mapea el estado de MercadoPago al estado interno."""
        mapeo = {
            "approved": EstadoPago.COMPLETADO,
            "pending": EstadoPago.PENDIENTE,
            "in_process": EstadoPago.PROCESANDO,
            "rejected": EstadoPago.FALLIDO,
            "refunded": EstadoPago.REEMBOLSADO,
            "cancelled": EstadoPago.CANCELADO,
            "charged_back": EstadoPago.REEMBOLSADO
        }
        return mapeo.get(estado_mp, EstadoPago.PENDIENTE)
