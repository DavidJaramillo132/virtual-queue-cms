"""
Almacen en memoria para partners (reemplazar por DB en produccion).
"""
from datetime import datetime
from typing import Optional, Dict, List, Any
from app.modelos.partner import TipoEvento


class PartnerData:
    """Datos de un partner."""
    
    def __init__(
        self,
        id: str,
        nombre: str,
        webhook_url: str,
        eventos_suscritos: List[TipoEvento],
        hmac_secret: str,
        descripcion: Optional[str] = None,
        contacto_email: Optional[str] = None,
        metadatos: Optional[Dict] = None
    ):
        self.id = id
        self.nombre = nombre
        self.webhook_url = webhook_url
        self.eventos_suscritos = eventos_suscritos
        self.hmac_secret = hmac_secret
        self.activo = True
        self.descripcion = descripcion
        self.contacto_email = contacto_email
        self.metadatos = metadatos or {}
        self.ultimo_webhook_enviado: Optional[datetime] = None
        self.ultimo_webhook_recibido: Optional[Dict[str, Any]] = None
        self.webhooks_exitosos = 0
        self.webhooks_fallidos = 0
        self.webhooks_recibidos_exitosos = 0
        self.webhooks_recibidos_fallidos = 0
        self.creado_en = datetime.utcnow()
        self.actualizado_en = datetime.utcnow()
    
    def to_dict(self) -> dict:
        """Convierte a diccionario."""
        return {
            "id": self.id,
            "nombre": self.nombre,
            "webhook_url": self.webhook_url,
            "eventos_suscritos": [e.value if isinstance(e, TipoEvento) else e for e in self.eventos_suscritos],
            "hmac_secret": self.hmac_secret,
            "activo": self.activo,
            "descripcion": self.descripcion,
            "contacto_email": self.contacto_email,
            "metadatos": self.metadatos,
            "ultimo_webhook_enviado": self.ultimo_webhook_enviado.isoformat() if self.ultimo_webhook_enviado else None,
            "webhooks_exitosos": self.webhooks_exitosos,
            "webhooks_fallidos": self.webhooks_fallidos,
            "creado_en": self.creado_en.isoformat(),
            "actualizado_en": self.actualizado_en.isoformat()
        }


class AlmacenPartners:
    """
    Almacen en memoria para partners.
    En produccion, reemplazar por una implementacion con base de datos.
    """
    
    _partners: Dict[str, PartnerData] = {}
    
    @classmethod
    def guardar(cls, partner: PartnerData) -> PartnerData:
        """Guarda o actualiza un partner."""
        partner.actualizado_en = datetime.utcnow()
        cls._partners[partner.id] = partner
        return partner
    
    @classmethod
    def obtener(cls, partner_id: str) -> Optional[PartnerData]:
        """Obtiene un partner por ID."""
        return cls._partners.get(partner_id)
    
    @classmethod
    def obtener_por_nombre(cls, nombre: str) -> Optional[PartnerData]:
        """Obtiene un partner por nombre."""
        for partner in cls._partners.values():
            if partner.nombre.lower() == nombre.lower():
                return partner
        return None
    
    @classmethod
    def listar(cls, solo_activos: bool = True) -> List[PartnerData]:
        """Lista todos los partners."""
        partners = list(cls._partners.values())
        if solo_activos:
            partners = [p for p in partners if p.activo]
        return partners
    
    @classmethod
    def eliminar(cls, partner_id: str) -> bool:
        """Elimina un partner."""
        if partner_id in cls._partners:
            del cls._partners[partner_id]
            return True
        return False
    
    @classmethod
    def obtener_por_metadatos(cls, clave: str, valor: Any) -> Optional[PartnerData]:
        """
        Obtiene un partner por un campo en sus metadatos.
        
        Args:
            clave: Clave en metadatos
            valor: Valor a buscar
            
        Returns:
            Partner si se encuentra, None en caso contrario
        """
        for partner in cls._partners.values():
            if partner.metadatos.get(clave) == valor:
                return partner
        return None
    
    @classmethod
    def obtener_por_evento(cls, evento: TipoEvento) -> List[PartnerData]:
        """Obtiene partners suscritos a un evento especifico."""
        resultado = []
        for partner in cls._partners.values():
            if not partner.activo:
                continue
            eventos = [e.value if isinstance(e, TipoEvento) else e for e in partner.eventos_suscritos]
            if evento.value in eventos or evento in partner.eventos_suscritos:
                resultado.append(partner)
        return resultado
    
    @classmethod
    def actualizar_estadisticas(
        cls,
        partner_id: str,
        exitoso: bool
    ) -> None:
        """Actualiza estadisticas de webhooks enviados."""
        partner = cls._partners.get(partner_id)
        if partner:
            partner.ultimo_webhook_enviado = datetime.utcnow()
            if exitoso:
                partner.webhooks_exitosos += 1
            else:
                partner.webhooks_fallidos += 1
    
    @classmethod
    def limpiar(cls) -> None:
        """Limpia todos los partners (para testing)."""
        cls._partners.clear()
