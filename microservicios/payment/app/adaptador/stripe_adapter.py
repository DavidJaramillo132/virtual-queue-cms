"""
Adaptador para Stripe.
Implementa la integracion con la pasarela de pago Stripe.
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


class StripeAdapter(ProveedorPagoBase):
    """
    Adaptador para la pasarela de pago Stripe.
    Requiere configurar STRIPE_SECRET_KEY en las variables de entorno.
    """
    
    def __init__(self):
        self._stripe = None
        self._inicializado = False
        
    def _inicializar_stripe(self) -> bool:
        """Inicializa el cliente de Stripe si no esta inicializado."""
        if self._inicializado:
            return True
            
        if not configuracion.STRIPE_SECRET_KEY:
            return False
            
        try:
            import stripe
            stripe.api_key = configuracion.STRIPE_SECRET_KEY
            self._stripe = stripe
            self._inicializado = True
            return True
        except ImportError:
            return False
    
    @property
    def nombre(self) -> str:
        return "stripe"
    
    async def crear_pago(
        self,
        monto: float,
        moneda: str,
        descripcion: str,
        metadatos: Optional[Dict[str, Any]] = None,
        url_retorno: Optional[str] = None,
        url_cancelacion: Optional[str] = None
    ) -> ResultadoPago:
        """Crea un PaymentIntent en Stripe."""
        if not self._inicializar_stripe():
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error="Stripe no esta configurado correctamente"
            )
        
        try:
            # Convertir monto a centavos
            monto_centavos = int(monto * 100)
            
            # Crear sesion de checkout
            sesion = self._stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": moneda.lower(),
                        "product_data": {
                            "name": descripcion,
                        },
                        "unit_amount": monto_centavos,
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=url_retorno or "https://localhost/success",
                cancel_url=url_cancelacion or "https://localhost/cancel",
                metadata=metadatos or {}
            )
            
            return ResultadoPago(
                exitoso=True,
                id_transaccion=sesion.payment_intent or sesion.id,
                id_externo=sesion.id,
                estado=EstadoPago.PENDIENTE,
                url_checkout=sesion.url,
                monto=monto,
                moneda=moneda,
                mensaje="Sesion de checkout creada",
                metadatos={"session_id": sesion.id}
            )
            
        except Exception as e:
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error=str(e)
            )
    
    async def verificar_pago(self, id_transaccion: str) -> ResultadoPago:
        """Verifica el estado de un PaymentIntent."""
        if not self._inicializar_stripe():
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error="Stripe no esta configurado"
            )
        
        try:
            # Intentar obtener PaymentIntent o Session
            if id_transaccion.startswith("cs_"):
                sesion = self._stripe.checkout.Session.retrieve(id_transaccion)
                estado = self._mapear_estado_sesion(sesion.payment_status)
                monto = sesion.amount_total / 100 if sesion.amount_total else 0
            else:
                intent = self._stripe.PaymentIntent.retrieve(id_transaccion)
                estado = self._mapear_estado_intent(intent.status)
                monto = intent.amount / 100 if intent.amount else 0
            
            return ResultadoPago(
                exitoso=True,
                id_transaccion=id_transaccion,
                estado=estado,
                monto=monto
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
        """Procesa un reembolso en Stripe."""
        if not self._inicializar_stripe():
            return ResultadoReembolso(
                exitoso=False,
                error="Stripe no esta configurado"
            )
        
        try:
            params = {"payment_intent": id_transaccion}
            
            if monto:
                params["amount"] = int(monto * 100)
            if razon:
                params["reason"] = "requested_by_customer"
            
            reembolso = self._stripe.Refund.create(**params)
            
            return ResultadoReembolso(
                exitoso=True,
                id_reembolso=reembolso.id,
                id_pago_original=id_transaccion,
                monto=reembolso.amount / 100,
                estado=EstadoPago.REEMBOLSADO,
                mensaje="Reembolso procesado exitosamente"
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
        """Crea una suscripcion en Stripe."""
        if not self._inicializar_stripe():
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error="Stripe no esta configurado"
            )
        
        try:
            # Mapear intervalo
            intervalo_stripe = "month" if intervalo == "mensual" else "year"
            
            # Crear producto y precio
            producto = self._stripe.Product.create(
                name="Suscripcion Premium Virtual Queue",
                metadata=metadatos or {}
            )
            
            precio_stripe = self._stripe.Price.create(
                product=producto.id,
                unit_amount=int(precio * 100),
                currency=moneda.lower(),
                recurring={"interval": intervalo_stripe}
            )
            
            return ResultadoPago(
                exitoso=True,
                id_transaccion=precio_stripe.id,
                id_externo=producto.id,
                estado=EstadoPago.COMPLETADO,
                monto=precio,
                moneda=moneda,
                mensaje="Producto de suscripcion creado",
                metadatos={
                    "producto_id": producto.id,
                    "precio_id": precio_stripe.id
                }
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
        """Cancela una suscripcion en Stripe."""
        if not self._inicializar_stripe():
            return ResultadoPago(
                exitoso=False,
                estado=EstadoPago.FALLIDO,
                error="Stripe no esta configurado"
            )
        
        try:
            if inmediatamente:
                suscripcion = self._stripe.Subscription.delete(id_suscripcion)
            else:
                suscripcion = self._stripe.Subscription.modify(
                    id_suscripcion,
                    cancel_at_period_end=True
                )
            
            return ResultadoPago(
                exitoso=True,
                id_transaccion=id_suscripcion,
                estado=EstadoPago.CANCELADO,
                mensaje="Suscripcion cancelada"
            )
            
        except Exception as e:
            return ResultadoPago(
                exitoso=False,
                id_transaccion=id_suscripcion,
                estado=EstadoPago.FALLIDO,
                error=str(e)
            )
    
    def normalizar_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza un webhook de Stripe al formato interno."""
        tipo_evento = payload.get("type", "unknown")
        datos = payload.get("data", {}).get("object", {})
        
        # Mapeo de eventos Stripe a eventos internos
        mapeo_eventos = {
            "payment_intent.succeeded": TipoEvento.PAYMENT_SUCCESS,
            "payment_intent.payment_failed": TipoEvento.PAYMENT_FAILED,
            "charge.refunded": TipoEvento.PAYMENT_REFUNDED,
            "customer.subscription.created": TipoEvento.SUBSCRIPTION_CREATED,
            "customer.subscription.deleted": TipoEvento.SUBSCRIPTION_CANCELLED,
            "customer.subscription.updated": TipoEvento.SUBSCRIPTION_RENEWED,
            "invoice.paid": TipoEvento.PAYMENT_SUCCESS,
            "invoice.payment_failed": TipoEvento.PAYMENT_FAILED
        }
        
        tipo_normalizado = mapeo_eventos.get(tipo_evento, TipoEvento.EXTERNAL_SERVICE)
        
        # Extraer datos relevantes
        datos_normalizados = {
            "id_externo": datos.get("id"),
            "monto": datos.get("amount", 0) / 100 if datos.get("amount") else 0,
            "moneda": datos.get("currency", "usd").upper(),
            "estado": datos.get("status"),
            "metadatos": datos.get("metadata", {})
        }
        
        return {
            "id": payload.get("id"),
            "tipo": tipo_normalizado.value,
            "pasarela": "stripe",
            "evento_original": tipo_evento,
            "datos": datos_normalizados,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def verificar_firma_webhook(
        self,
        payload: bytes,
        firma: str,
        secreto: str
    ) -> bool:
        """Verifica la firma de un webhook de Stripe."""
        if not self._inicializar_stripe():
            return False
        
        try:
            self._stripe.Webhook.construct_event(
                payload,
                firma,
                secreto or configuracion.STRIPE_WEBHOOK_SECRET
            )
            return True
        except Exception:
            return False
    
    def _mapear_estado_intent(self, estado_stripe: str) -> EstadoPago:
        """Mapea el estado de Stripe al estado interno."""
        mapeo = {
            "succeeded": EstadoPago.COMPLETADO,
            "processing": EstadoPago.PROCESANDO,
            "requires_payment_method": EstadoPago.PENDIENTE,
            "requires_confirmation": EstadoPago.PENDIENTE,
            "requires_action": EstadoPago.PENDIENTE,
            "canceled": EstadoPago.CANCELADO,
            "requires_capture": EstadoPago.PROCESANDO
        }
        return mapeo.get(estado_stripe, EstadoPago.PENDIENTE)
    
    def _mapear_estado_sesion(self, estado_pago: str) -> EstadoPago:
        """Mapea el estado de pago de sesion al estado interno."""
        mapeo = {
            "paid": EstadoPago.COMPLETADO,
            "unpaid": EstadoPago.PENDIENTE,
            "no_payment_required": EstadoPago.COMPLETADO
        }
        return mapeo.get(estado_pago, EstadoPago.PENDIENTE)
