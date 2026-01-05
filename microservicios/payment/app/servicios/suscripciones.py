"""
Servicio de gestion de suscripciones premium.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

import httpx

from app.modelos.suscripcion import (
    EstadoSuscripcion,
    TipoSuscripcion,
    CrearSuscripcionRequest,
    SuscripcionResponse,
    CancelarSuscripcionRequest,
    BeneficiosPremium,
    VerificarPremiumResponse
)
from app.adaptador import obtener_adaptador
from app.config import configuracion
from app.partners.servicio import ServicioPartners
from app.modelos.partner import TipoEvento


class SuscripcionData:
    """Datos de una suscripcion."""
    
    def __init__(
        self,
        id: str,
        usuario_id: str,
        tipo: TipoSuscripcion,
        estado: EstadoSuscripcion,
        precio_mensual: float,
        fecha_inicio: datetime,
        fecha_fin: Optional[datetime] = None,
        fecha_proximo_cobro: Optional[datetime] = None,
        dias_prueba_restantes: int = 0,
        id_suscripcion_externa: Optional[str] = None
    ):
        self.id = id
        self.usuario_id = usuario_id
        self.tipo = tipo
        self.estado = estado
        self.precio_mensual = precio_mensual
        self.moneda = "USD"
        self.fecha_inicio = fecha_inicio
        self.fecha_fin = fecha_fin
        self.fecha_proximo_cobro = fecha_proximo_cobro
        self.dias_prueba_restantes = dias_prueba_restantes
        self.beneficios = BeneficiosPremium()
        self.id_suscripcion_externa = id_suscripcion_externa
        self.historial_pagos: List[str] = []
        self.creado_en = datetime.utcnow()
        self.actualizado_en = datetime.utcnow()


class AlmacenSuscripciones:
    """Almacen en memoria para suscripciones."""
    
    _suscripciones: Dict[str, SuscripcionData] = {}
    _por_usuario: Dict[str, str] = {}  # usuario_id -> suscripcion_id
    
    @classmethod
    def guardar(cls, suscripcion: SuscripcionData) -> SuscripcionData:
        """Guarda una suscripcion."""
        suscripcion.actualizado_en = datetime.utcnow()
        cls._suscripciones[suscripcion.id] = suscripcion
        cls._por_usuario[suscripcion.usuario_id] = suscripcion.id
        return suscripcion
    
    @classmethod
    def obtener(cls, suscripcion_id: str) -> Optional[SuscripcionData]:
        """Obtiene una suscripcion por ID."""
        return cls._suscripciones.get(suscripcion_id)
    
    @classmethod
    def obtener_por_usuario(cls, usuario_id: str) -> Optional[SuscripcionData]:
        """Obtiene la suscripcion de un usuario."""
        suscripcion_id = cls._por_usuario.get(usuario_id)
        if suscripcion_id:
            return cls._suscripciones.get(suscripcion_id)
        return None
    
    @classmethod
    def listar_activas(cls) -> List[SuscripcionData]:
        """Lista suscripciones activas."""
        return [
            s for s in cls._suscripciones.values()
            if s.estado in [EstadoSuscripcion.ACTIVA, EstadoSuscripcion.PRUEBA]
        ]
    
    @classmethod
    def eliminar(cls, suscripcion_id: str) -> bool:
        """Elimina una suscripcion."""
        suscripcion = cls._suscripciones.get(suscripcion_id)
        if suscripcion:
            del cls._suscripciones[suscripcion_id]
            if suscripcion.usuario_id in cls._por_usuario:
                del cls._por_usuario[suscripcion.usuario_id]
            return True
        return False
    
    @classmethod
    def limpiar(cls) -> None:
        """Limpia todo el almacen."""
        cls._suscripciones.clear()
        cls._por_usuario.clear()


class ServicioSuscripciones:
    """
    Servicio para gestionar suscripciones premium.
    """
    
    @staticmethod
    async def crear_suscripcion(
        request: CrearSuscripcionRequest
    ) -> SuscripcionResponse:
        """
        Crea una nueva suscripcion para un negocio.
        
        Args:
            request: Datos de la suscripcion
            
        Returns:
            SuscripcionResponse con la suscripcion creada
        """
        # Verificar si ya tiene suscripcion activa
        existente = AlmacenSuscripciones.obtener_por_usuario(request.usuario_id)
        if existente and existente.estado in [EstadoSuscripcion.ACTIVA, EstadoSuscripcion.PRUEBA]:
            raise ValueError("El usuario ya tiene una suscripcion activa")
        
        # Generar ID
        suscripcion_id = f"sub_{uuid.uuid4().hex[:12]}"
        
        # Determinar estado inicial y fechas
        ahora = datetime.utcnow()
        if request.con_prueba_gratis:
            estado = EstadoSuscripcion.PRUEBA
            dias_prueba = configuracion.DIAS_PRUEBA_GRATIS
            fecha_proximo_cobro = ahora + timedelta(days=dias_prueba)
        else:
            estado = EstadoSuscripcion.ACTIVA
            dias_prueba = 0
            fecha_proximo_cobro = ahora + timedelta(days=30)
        
        # Crear en pasarela de pago si no es prueba
        id_externo = None
        if not request.con_prueba_gratis:
            adaptador = obtener_adaptador()
            resultado = await adaptador.crear_suscripcion(
                precio=configuracion.PRECIO_SUSCRIPCION_MENSUAL,
                moneda="USD",
                intervalo="mensual",
                metadatos={"usuario_id": request.usuario_id}
            )
            if resultado.exitoso:
                id_externo = resultado.id_externo
        
        # Crear suscripcion
        suscripcion = SuscripcionData(
            id=suscripcion_id,
            usuario_id=request.usuario_id,
            tipo=request.tipo,
            estado=estado,
            precio_mensual=configuracion.PRECIO_SUSCRIPCION_MENSUAL,
            fecha_inicio=ahora,
            fecha_proximo_cobro=fecha_proximo_cobro,
            dias_prueba_restantes=dias_prueba,
            id_suscripcion_externa=id_externo
        )
        
        AlmacenSuscripciones.guardar(suscripcion)
        
        # Notificar a partners
        await ServicioPartners.notificar_evento(
            evento=TipoEvento.SUBSCRIPTION_CREATED,
            datos={
                "suscripcion_id": suscripcion_id,
                "usuario_id": request.usuario_id,
                "tipo": request.tipo.value,
                "estado": estado.value
            }
        )
        
        # Notificar al backend REST para actualizar el usuario
        await ServicioSuscripciones._actualizar_usuario_premium(
            request.usuario_id,
            es_premium=True
        )
        
        return ServicioSuscripciones._to_response(suscripcion)
    
    @staticmethod
    async def obtener_suscripcion(suscripcion_id: str) -> Optional[SuscripcionResponse]:
        """Obtiene una suscripcion por ID."""
        suscripcion = AlmacenSuscripciones.obtener(suscripcion_id)
        if not suscripcion:
            return None
        return ServicioSuscripciones._to_response(suscripcion)
    
    @staticmethod
    async def obtener_por_usuario(usuario_id: str) -> Optional[SuscripcionResponse]:
        """Obtiene la suscripcion de un usuario."""
        suscripcion = AlmacenSuscripciones.obtener_por_usuario(usuario_id)
        if not suscripcion:
            return None
        return ServicioSuscripciones._to_response(suscripcion)
    
    @staticmethod
    async def verificar_premium(usuario_id: str) -> VerificarPremiumResponse:
        """
        Verifica si un usuario tiene suscripcion premium activa.
        
        Args:
            usuario_id: ID del usuario
            
        Returns:
            VerificarPremiumResponse con el estado premium
        """
        suscripcion = AlmacenSuscripciones.obtener_por_usuario(usuario_id)
        
        if not suscripcion:
            return VerificarPremiumResponse(
                usuario_id=usuario_id,
                es_premium=False
            )
        
        es_premium = suscripcion.estado in [
            EstadoSuscripcion.ACTIVA,
            EstadoSuscripcion.PRUEBA
        ]
        
        return VerificarPremiumResponse(
            usuario_id=usuario_id,
            es_premium=es_premium,
            tipo_suscripcion=suscripcion.tipo if es_premium else None,
            estado=suscripcion.estado,
            beneficios=suscripcion.beneficios if es_premium else None,
            fecha_vencimiento=suscripcion.fecha_proximo_cobro,
            nivel_prioridad=1 if es_premium else 5
        )
    
    @staticmethod
    async def cancelar_suscripcion(
        request: CancelarSuscripcionRequest
    ) -> Optional[SuscripcionResponse]:
        """Cancela una suscripcion."""
        suscripcion = AlmacenSuscripciones.obtener(request.suscripcion_id)
        if not suscripcion:
            return None
        
        # Cancelar en pasarela
        if suscripcion.id_suscripcion_externa:
            adaptador = obtener_adaptador()
            await adaptador.cancelar_suscripcion(
                suscripcion.id_suscripcion_externa,
                inmediatamente=request.cancelar_inmediatamente
            )
        
        # Actualizar estado
        if request.cancelar_inmediatamente:
            suscripcion.estado = EstadoSuscripcion.CANCELADA
            suscripcion.fecha_fin = datetime.utcnow()
        else:
            suscripcion.estado = EstadoSuscripcion.CANCELADA
            suscripcion.fecha_fin = suscripcion.fecha_proximo_cobro
        
        AlmacenSuscripciones.guardar(suscripcion)
        
        # Notificar
        await ServicioPartners.notificar_evento(
            evento=TipoEvento.SUBSCRIPTION_CANCELLED,
            datos={
                "suscripcion_id": suscripcion.id,
                "usuario_id": suscripcion.usuario_id,
                "razon": request.razon
            }
        )
        
        # Actualizar usuario
        if request.cancelar_inmediatamente:
            await ServicioSuscripciones._actualizar_usuario_premium(
                suscripcion.usuario_id,
                es_premium=False
            )
        
        return ServicioSuscripciones._to_response(suscripcion)
    
    @staticmethod
    async def listar_usuarios_premium() -> List[str]:
        """Lista los IDs de usuarios con suscripcion premium activa."""
        suscripciones = AlmacenSuscripciones.listar_activas()
        return [s.usuario_id for s in suscripciones]
    
    @staticmethod
    async def renovar_suscripcion(suscripcion_id: str) -> Optional[SuscripcionResponse]:
        """Renueva una suscripcion (llamado desde webhook de pago)."""
        suscripcion = AlmacenSuscripciones.obtener(suscripcion_id)
        if not suscripcion:
            return None
        
        # Actualizar fechas
        suscripcion.estado = EstadoSuscripcion.ACTIVA
        suscripcion.dias_prueba_restantes = 0
        suscripcion.fecha_proximo_cobro = datetime.utcnow() + timedelta(days=30)
        
        AlmacenSuscripciones.guardar(suscripcion)
        
        # Notificar
        await ServicioPartners.notificar_evento(
            evento=TipoEvento.SUBSCRIPTION_RENEWED,
            datos={
                "suscripcion_id": suscripcion.id,
                "usuario_id": suscripcion.usuario_id,
                "proximo_cobro": suscripcion.fecha_proximo_cobro.isoformat()
            }
        )
        
        return ServicioSuscripciones._to_response(suscripcion)
    
    @staticmethod
    async def _actualizar_usuario_premium(
        usuario_id: str,
        es_premium: bool
    ) -> bool:
        """
        Actualiza el estado premium de un usuario en el backend REST.
        
        Args:
            usuario_id: ID del usuario
            es_premium: Si es premium o no
            
        Returns:
            True si se actualizo correctamente
        """
        try:
            async with httpx.AsyncClient(timeout=10) as cliente:
                # Llamar al endpoint del REST API para actualizar el usuario
                respuesta = await cliente.patch(
                    f"{configuracion.REST_API_URL}/api/usuarios/{usuario_id}/premium",
                    json={"es_premium": es_premium}
                )
                print(f"[DEBUG] Actualizando usuario {usuario_id} premium={es_premium}, status={respuesta.status_code}")
                return respuesta.status_code in [200, 204]
        except Exception as e:
            print(f"Error actualizando usuario premium: {e}")
            return False
    
    @staticmethod
    def _to_response(suscripcion: SuscripcionData) -> SuscripcionResponse:
        """Convierte SuscripcionData a SuscripcionResponse."""
        return SuscripcionResponse(
            id=suscripcion.id,
            usuario_id=suscripcion.usuario_id,
            tipo=suscripcion.tipo,
            estado=suscripcion.estado,
            precio_mensual=suscripcion.precio_mensual,
            moneda=suscripcion.moneda,
            fecha_inicio=suscripcion.fecha_inicio,
            fecha_fin=suscripcion.fecha_fin,
            fecha_proximo_cobro=suscripcion.fecha_proximo_cobro,
            dias_prueba_restantes=suscripcion.dias_prueba_restantes,
            beneficios=suscripcion.beneficios,
            id_suscripcion_externa=suscripcion.id_suscripcion_externa,
            historial_pagos=suscripcion.historial_pagos,
            creado_en=suscripcion.creado_en,
            actualizado_en=suscripcion.actualizado_en
        )
