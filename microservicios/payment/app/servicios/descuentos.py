"""
Servicio de gestión de descuentos por eventos de partners.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from enum import Enum

from app.servicios.suscripciones import (
    AlmacenSuscripciones,
    SuscripcionData,
    ServicioSuscripciones
)
from app.modelos.suscripcion import EstadoSuscripcion
from app.partners.servicio import ServicioPartners
from app.modelos.partner import TipoEvento


class TipoDescuento(str, Enum):
    """Tipos de descuentos disponibles."""
    ADOPCION_ANIMAL = "adopcion_animal"
    PRIMER_SERVICIO = "primer_servicio"
    REFERIDO = "referido"
    PROMOCION_PARTNER = "promocion_partner"


class DescuentoData:
    """Datos de un descuento aplicado."""
    
    def __init__(
        self,
        id: str,
        usuario_id: str,
        tipo: TipoDescuento,
        porcentaje: float,
        evento_origen: str,
        partner_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        fecha_aplicado: Optional[datetime] = None,
        fecha_expiracion: Optional[datetime] = None,
        activo: bool = True
    ):
        self.id = id
        self.usuario_id = usuario_id
        self.tipo = tipo
        self.porcentaje = porcentaje
        self.evento_origen = evento_origen
        self.partner_id = partner_id
        self.metadata = metadata or {}
        self.fecha_aplicado = fecha_aplicado or datetime.utcnow()
        self.fecha_expiracion = fecha_expiracion
        self.activo = activo
        self.aplicado_a_suscripciones: list[str] = []


class AlmacenDescuentos:
    """Almacén en memoria para descuentos."""
    
    _descuentos: Dict[str, DescuentoData] = {}
    _por_usuario: Dict[str, list[str]] = {}  # usuario_id -> [descuento_ids]
    _pendientes_por_email: Dict[str, list[str]] = {}  # email -> [descuento_ids]
    
    @classmethod
    def guardar(cls, descuento: DescuentoData) -> DescuentoData:
        """Guarda un descuento."""
        cls._descuentos[descuento.id] = descuento
        
        # Si tiene usuario_id, indexar por usuario
        if descuento.usuario_id:
            if descuento.usuario_id not in cls._por_usuario:
                cls._por_usuario[descuento.usuario_id] = []
            if descuento.id not in cls._por_usuario[descuento.usuario_id]:
                cls._por_usuario[descuento.usuario_id].append(descuento.id)
                
        # Si NO tiene usuario_id pero tiene email en metadata, indexar por email (pendiente)
        elif 'email' in descuento.metadata:
            email = descuento.metadata['email']
            if email not in cls._pendientes_por_email:
                cls._pendientes_por_email[email] = []
            if descuento.id not in cls._pendientes_por_email[email]:
                cls._pendientes_por_email[email].append(descuento.id)
        
        return descuento
    
    @classmethod
    def obtener(cls, descuento_id: str) -> Optional[DescuentoData]:
        """Obtiene un descuento por ID."""
        return cls._descuentos.get(descuento_id)
    
    @classmethod
    def obtener_por_usuario(cls, usuario_id: str, solo_activos: bool = True) -> list[DescuentoData]:
        """Obtiene todos los descuentos de un usuario."""
        descuento_ids = cls._por_usuario.get(usuario_id, [])
        descuentos = [cls._descuentos[did] for did in descuento_ids if did in cls._descuentos]
        
        if solo_activos:
            ahora = datetime.utcnow()
            return [
                d for d in descuentos 
                if d.activo and (d.fecha_expiracion is None or d.fecha_expiracion > ahora)
            ]
        return descuentos

    @classmethod
    def obtener_pendientes_por_email(cls, email: str) -> list[DescuentoData]:
        """Obtiene descuentos pendientes por email."""
        descuento_ids = cls._pendientes_por_email.get(email, [])
        return [cls._descuentos[did] for did in descuento_ids if did in cls._descuentos]

    @classmethod
    def asignar_usuario(cls, descuento_id: str, usuario_id: str):
        """Asigna un usuario a un descuento existente."""
        descuento = cls._descuentos.get(descuento_id)
        if not descuento: return
        
        # Remover de pendientes si estaba ahí
        if 'email' in descuento.metadata:
            email = descuento.metadata['email']
            if email in cls._pendientes_por_email and descuento_id in cls._pendientes_por_email[email]:
                cls._pendientes_por_email[email].remove(descuento_id)
        
        # Asignar usuario
        descuento.usuario_id = usuario_id
        cls.guardar(descuento)


class ServicioDescuentos:
    """
    Servicio para gestionar descuentos automáticos por eventos de partners.
    """
    
    @staticmethod
    async def aplicar_descuento_adopcion(
        usuario_email: str,
        partner_id: str,
        metadata: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Aplica un descuento por adopción."""
        import uuid
        
        usuario_id = await ServicioDescuentos._buscar_usuario_por_email(usuario_email)
        
        # Si no hay usuario, guardar como PENDIENTE
        modo_pendiente = False
        if not usuario_id:
            print(f"⚠️ Usuario con email {usuario_email} no encontrado. Guardando descuento PENDIENTE.")
            modo_pendiente = True
        
        usuario_id_check = usuario_id or "PENDIENTE"

        # Verificar duplicados
        descuentos_existentes = []
        if usuario_id:
            descuentos_existentes = AlmacenDescuentos.obtener_por_usuario(usuario_id)
        else:
            descuentos_existentes = AlmacenDescuentos.obtener_pendientes_por_email(usuario_email)

        tiene_descuento_adopcion = any(
            d.tipo == TipoDescuento.ADOPCION_ANIMAL 
            for d in descuentos_existentes
        )
        
        if tiene_descuento_adopcion:
            print(f"ℹ️ Usuario {usuario_id_check} ya tiene descuento por adopción")
            return {
                "status": "already_applied",
                "message": "El usuario ya tiene un descuento por adopción"
            }
        
        # Crear descuento
        descuento_id = f"desc_{uuid.uuid4().hex[:12]}"
        porcentaje_descuento = 20.0
        
        descuento = DescuentoData(
            id=descuento_id,
            usuario_id=usuario_id if usuario_id else "", # Vacío si es pendiente
            tipo=TipoDescuento.ADOPCION_ANIMAL,
            porcentaje=porcentaje_descuento,
            evento_origen="animal.adopted",
            partner_id=partner_id,
            metadata={
                **metadata,
                "email": usuario_email,
                "estado": "pendiente" if modo_pendiente else "aplicado"
            },
            fecha_expiracion=datetime.utcnow() + timedelta(days=90)
        )
        
        AlmacenDescuentos.guardar(descuento)
        
        resultado = {"aplicado": False}
        if usuario_id:
            resultado = await ServicioDescuentos._aplicar_a_suscripcion(usuario_id, descuento)
        
        return {
            "status": "success",
            "descuento_id": descuento_id,
            "porcentaje": porcentaje_descuento,
            "usuario_id": usuario_id_check,
            "estado": "pendiente" if modo_pendiente else "aplicado",
            "aplicado_a_suscripcion": resultado.get("aplicado", False)
        }

    @staticmethod
    async def reclamar_descuentos_pendientes(email: str, usuario_id: str) -> dict:
        """Asigna descuentos pendientes de un email a un usuario."""
        pendientes = AlmacenDescuentos.obtener_pendientes_por_email(email)
        reclamados = 0
        
        for descuento in pendientes:
            print(f"🔗 Asignando descuento {descuento.id} a usuario {usuario_id}")
            AlmacenDescuentos.asignar_usuario(descuento.id, usuario_id)
            descuento.metadata['estado'] = 'reclamado'
            reclamados += 1
            
            # Intentar aplicar a suscripción si existe
            await ServicioDescuentos._aplicar_a_suscripcion(usuario_id, descuento)
            
        return {
            "usuario_id": usuario_id,
            "email": email,
            "descuentos_reclamados": reclamados
        }

    @staticmethod
    async def _buscar_usuario_por_email(email: str) -> Optional[str]:
        """Busca un usuario por email."""
        suscripcion = AlmacenSuscripciones.obtener_por_email(email)
        if suscripcion:
            return suscripcion.usuario_id
        return None
    
    @staticmethod
    async def _aplicar_a_suscripcion(usuario_id: str, descuento: DescuentoData) -> Dict[str, Any]:
        """Aplica el descuento a la suscripción del usuario."""
        suscripcion = AlmacenSuscripciones.obtener_por_usuario(usuario_id)
        
        if not suscripcion:
            return {"aplicado": False, "razon": "no_subscription"}
        
        if suscripcion.estado not in [EstadoSuscripcion.ACTIVA, EstadoSuscripcion.PRUEBA]:
            return {"aplicado": False, "razon": "inactive_subscription"}
        
        precio_original = suscripcion.precio_mensual
        precio_con_descuento = precio_original * (1 - descuento.porcentaje / 100)
        
        suscripcion.precio_mensual = precio_con_descuento
        suscripcion.metadata = getattr(suscripcion, 'metadata', {})
        suscripcion.metadata['descuento_aplicado'] = {
            'id': descuento.id,
            'porcentaje': descuento.porcentaje,
            'precio_original': precio_original,
            'precio_con_descuento': precio_con_descuento
        }
        
        AlmacenSuscripciones.guardar(suscripcion)
        
        # Registrar
        if suscripcion.id not in descuento.aplicado_a_suscripciones:
            descuento.aplicado_a_suscripciones.append(suscripcion.id)
            AlmacenDescuentos.guardar(descuento)
        
        return {"aplicado": True}
    
    @staticmethod
    async def obtener_descuentos_usuario(usuario_id: str) -> list[Dict[str, Any]]:
        """Obtiene todos los descuentos activos de un usuario."""
        descuentos = AlmacenDescuentos.obtener_por_usuario(usuario_id, solo_activos=True)
        return [
            {
                "id": d.id,
                "tipo": d.tipo.value,
                "porcentaje": d.porcentaje,
                "evento_origen": d.evento_origen,
                "metadata": d.metadata
            }
            for d in descuentos
        ]
