"""
Servicio de gestion de partners B2B.
"""
import uuid
import json
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any

import httpx

from app.modelos.partner import (
    TipoEvento,
    RegistrarPartnerRequest,
    PartnerResponse,
    ActualizarPartnerRequest
)
from app.modelos.webhook import NotificacionPartner
from app.partners.almacen import AlmacenPartners, PartnerData
from app.seguridad.hmac_auth import generar_secreto, generar_firma_hmac
from app.config import configuracion


class ServicioPartners:
    """
    Servicio para gestionar partners B2B y envio de webhooks.
    """
    
    @staticmethod
    async def registrar_partner(request: RegistrarPartnerRequest) -> PartnerResponse:
        """
        Registra un nuevo partner.
        
        Args:
            request: Datos del partner a registrar
            
        Returns:
            PartnerResponse con los datos del partner creado
        """
        # Verificar si ya existe un partner con ese nombre
        existente = AlmacenPartners.obtener_por_nombre(request.nombre)
        if existente:
            raise ValueError(f"Ya existe un partner con el nombre '{request.nombre}'")
        
        # Generar ID y secreto
        partner_id = f"partner_{uuid.uuid4().hex[:12]}"
        hmac_secret = generar_secreto()
        
        # Crear partner
        partner = PartnerData(
            id=partner_id,
            nombre=request.nombre,
            webhook_url=request.webhook_url,
            eventos_suscritos=request.eventos_suscritos,
            hmac_secret=hmac_secret,
            descripcion=request.descripcion,
            contacto_email=request.contacto_email,
            metadatos=request.metadatos
        )
        
        # Guardar
        AlmacenPartners.guardar(partner)
        
        return PartnerResponse(
            id=partner.id,
            nombre=partner.nombre,
            webhook_url=partner.webhook_url,
            eventos_suscritos=partner.eventos_suscritos,
            hmac_secret=partner.hmac_secret,
            activo=partner.activo,
            descripcion=partner.descripcion,
            contacto_email=partner.contacto_email,
            metadatos=partner.metadatos,
            ultimo_webhook_enviado=partner.ultimo_webhook_enviado,
            webhooks_exitosos=partner.webhooks_exitosos,
            webhooks_fallidos=partner.webhooks_fallidos,
            creado_en=partner.creado_en,
            actualizado_en=partner.actualizado_en
        )
    
    @staticmethod
    async def obtener_partner(partner_id: str) -> Optional[PartnerResponse]:
        """Obtiene un partner por ID."""
        partner = AlmacenPartners.obtener(partner_id)
        if not partner:
            return None
        
        return PartnerResponse(**partner.to_dict())
    
    @staticmethod
    async def listar_partners(solo_activos: bool = True) -> List[PartnerResponse]:
        """Lista todos los partners."""
        partners = AlmacenPartners.listar(solo_activos)
        return [PartnerResponse(**p.to_dict()) for p in partners]
    
    @staticmethod
    async def actualizar_partner(
        partner_id: str,
        request: ActualizarPartnerRequest
    ) -> Optional[PartnerResponse]:
        """Actualiza un partner existente."""
        partner = AlmacenPartners.obtener(partner_id)
        if not partner:
            return None
        
        # Actualizar campos
        if request.nombre is not None:
            partner.nombre = request.nombre
        if request.webhook_url is not None:
            partner.webhook_url = request.webhook_url
        if request.eventos_suscritos is not None:
            partner.eventos_suscritos = request.eventos_suscritos
        if request.activo is not None:
            partner.activo = request.activo
        if request.descripcion is not None:
            partner.descripcion = request.descripcion
        if request.contacto_email is not None:
            partner.contacto_email = request.contacto_email
        
        # Regenerar secreto si se solicita
        if request.regenerar_secret:
            partner.hmac_secret = generar_secreto()
        
        AlmacenPartners.guardar(partner)
        
        return PartnerResponse(**partner.to_dict())
    
    @staticmethod
    async def eliminar_partner(partner_id: str) -> bool:
        """Elimina un partner."""
        return AlmacenPartners.eliminar(partner_id)
    
    @staticmethod
    async def notificar_evento(
        evento: TipoEvento,
        datos: Dict[str, Any],
        metadatos: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Notifica un evento a todos los partners suscritos.
        
        Args:
            evento: Tipo de evento a notificar
            datos: Datos del evento
            metadatos: Metadatos adicionales
            
        Returns:
            Diccionario con resultados de los envios
        """
        partners = AlmacenPartners.obtener_por_evento(evento)
        
        if not partners:
            return {
                "evento": evento.value,
                "partners_notificados": 0,
                "mensaje": "No hay partners suscritos a este evento"
            }
        
        # Crear notificacion
        notificacion = NotificacionPartner(
            evento_id=f"evt_{uuid.uuid4().hex[:12]}",
            tipo_evento=evento,
            datos=datos,
            metadatos=metadatos or {}
        )
        
        # Enviar a todos los partners en paralelo
        resultados = await asyncio.gather(*[
            ServicioPartners._enviar_webhook(partner, notificacion)
            for partner in partners
        ], return_exceptions=True)
        
        # Procesar resultados
        exitosos = sum(1 for r in resultados if r is True)
        fallidos = len(resultados) - exitosos
        
        return {
            "evento": evento.value,
            "evento_id": notificacion.evento_id,
            "partners_notificados": len(partners),
            "exitosos": exitosos,
            "fallidos": fallidos,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    async def _enviar_webhook(
        partner: PartnerData,
        notificacion: NotificacionPartner
    ) -> bool:
        """
        Envia un webhook a un partner con reintentos.
        
        Args:
            partner: Partner destino
            notificacion: Notificacion a enviar
            
        Returns:
            True si se envio correctamente
        """
        payload = notificacion.model_dump_json().encode()
        
        # Generar firma HMAC
        firma, timestamp = generar_firma_hmac(payload, partner.hmac_secret)
        
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": firma,
            "X-Webhook-Timestamp": str(timestamp),
            "X-Event-Type": notificacion.tipo_evento.value,
            "X-Event-ID": notificacion.evento_id,
            "User-Agent": "VirtualQueueCMS-Webhook/1.0"
        }
        
        # Intentar enviar con reintentos
        for intento in range(configuracion.WEBHOOK_REINTENTOS):
            try:
                async with httpx.AsyncClient(timeout=configuracion.WEBHOOK_TIMEOUT) as cliente:
                    respuesta = await cliente.post(
                        partner.webhook_url,
                        content=payload,
                        headers=headers
                    )
                    
                    if respuesta.status_code in [200, 201, 202, 204]:
                        AlmacenPartners.actualizar_estadisticas(partner.id, exitoso=True)
                        return True
                    
            except Exception as e:
                if intento < configuracion.WEBHOOK_REINTENTOS - 1:
                    await asyncio.sleep(2 ** intento)  # Backoff exponencial
                continue
        
        AlmacenPartners.actualizar_estadisticas(partner.id, exitoso=False)
        return False
    
    @staticmethod
    async def verificar_webhook_url(webhook_url: str) -> Dict[str, Any]:
        """
        Verifica que una URL de webhook sea accesible.
        
        Args:
            webhook_url: URL a verificar
            
        Returns:
            Diccionario con resultado de la verificacion
        """
        try:
            async with httpx.AsyncClient(timeout=10) as cliente:
                # Enviar ping de verificacion
                respuesta = await cliente.post(
                    webhook_url,
                    json={
                        "tipo": "webhook.test",
                        "mensaje": "Verificacion de conectividad",
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                return {
                    "url": webhook_url,
                    "accesible": respuesta.status_code < 500,
                    "codigo_estado": respuesta.status_code,
                    "mensaje": "URL accesible" if respuesta.status_code < 500 else "Error del servidor"
                }
                
        except httpx.ConnectError:
            return {
                "url": webhook_url,
                "accesible": False,
                "error": "No se puede conectar a la URL"
            }
        except httpx.TimeoutException:
            return {
                "url": webhook_url,
                "accesible": False,
                "error": "Timeout al conectar"
            }
        except Exception as e:
            return {
                "url": webhook_url,
                "accesible": False,
                "error": str(e)
            }
