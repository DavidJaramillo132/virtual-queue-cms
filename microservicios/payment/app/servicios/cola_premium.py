"""
Sistema de colas con prioridad para usuarios premium.
"""
import asyncio
import heapq
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum


class PrioridadCola(int, Enum):
    """Niveles de prioridad en la cola."""
    PREMIUM = 1    # Maxima prioridad
    NORMAL = 5     # Prioridad estandar
    BAJA = 10      # Baja prioridad


@dataclass(order=True)
class ElementoCola:
    """
    Elemento en la cola con prioridad.
    Ordenado por prioridad (menor = mayor prioridad) y luego por timestamp.
    """
    prioridad: int
    timestamp: float = field(compare=True)
    cita_id: str = field(compare=False)
    negocio_id: str = field(compare=False)
    usuario_id: str = field(compare=False)
    es_premium: bool = field(compare=False, default=False)
    datos: Dict[str, Any] = field(compare=False, default_factory=dict)
    
    @classmethod
    def crear(
        cls,
        cita_id: str,
        negocio_id: str,
        usuario_id: str,
        es_premium: bool = False,
        datos: Optional[Dict[str, Any]] = None
    ) -> "ElementoCola":
        """Crea un elemento con la prioridad correcta."""
        prioridad = PrioridadCola.PREMIUM if es_premium else PrioridadCola.NORMAL
        return cls(
            prioridad=prioridad.value,
            timestamp=datetime.utcnow().timestamp(),
            cita_id=cita_id,
            negocio_id=negocio_id,
            usuario_id=usuario_id,
            es_premium=es_premium,
            datos=datos or {}
        )


class ColaPremium:
    """
    Cola con prioridad para citas.
    Los usuarios premium tienen prioridad sobre los normales.
    Usa un heap para mantener el orden eficientemente.
    """
    
    _colas: Dict[str, List[ElementoCola]] = {}  # Por negocio
    _elementos_por_cita: Dict[str, str] = {}  # cita_id -> negocio_id
    
    @classmethod
    def agregar(cls, elemento: ElementoCola) -> int:
        """
        Agrega un elemento a la cola del negocio.
        
        Args:
            elemento: Elemento a agregar
            
        Returns:
            Posicion en la cola
        """
        negocio_id = elemento.negocio_id
        
        if negocio_id not in cls._colas:
            cls._colas[negocio_id] = []
        
        heapq.heappush(cls._colas[negocio_id], elemento)
        cls._elementos_por_cita[elemento.cita_id] = negocio_id
        
        return cls.obtener_posicion(elemento.cita_id)
    
    @classmethod
    def siguiente(cls, negocio_id: str) -> Optional[ElementoCola]:
        """
        Obtiene y remueve el siguiente elemento de la cola.
        
        Args:
            negocio_id: ID del negocio
            
        Returns:
            Siguiente elemento o None si la cola esta vacia
        """
        if negocio_id not in cls._colas or not cls._colas[negocio_id]:
            return None
        
        elemento = heapq.heappop(cls._colas[negocio_id])
        if elemento.cita_id in cls._elementos_por_cita:
            del cls._elementos_por_cita[elemento.cita_id]
        
        return elemento
    
    @classmethod
    def ver_siguiente(cls, negocio_id: str) -> Optional[ElementoCola]:
        """Ve el siguiente elemento sin removerlo."""
        if negocio_id not in cls._colas or not cls._colas[negocio_id]:
            return None
        return cls._colas[negocio_id][0]
    
    @classmethod
    def obtener_posicion(cls, cita_id: str) -> int:
        """
        Obtiene la posicion de una cita en la cola.
        
        Args:
            cita_id: ID de la cita
            
        Returns:
            Posicion (1-indexed) o -1 si no existe
        """
        negocio_id = cls._elementos_por_cita.get(cita_id)
        if not negocio_id or negocio_id not in cls._colas:
            return -1
        
        # Ordenar temporalmente para obtener posicion real
        cola_ordenada = sorted(cls._colas[negocio_id])
        for i, elemento in enumerate(cola_ordenada):
            if elemento.cita_id == cita_id:
                return i + 1
        
        return -1
    
    @classmethod
    def remover(cls, cita_id: str) -> bool:
        """
        Remueve una cita de la cola.
        
        Args:
            cita_id: ID de la cita a remover
            
        Returns:
            True si se removio
        """
        negocio_id = cls._elementos_por_cita.get(cita_id)
        if not negocio_id or negocio_id not in cls._colas:
            return False
        
        cola = cls._colas[negocio_id]
        for i, elemento in enumerate(cola):
            if elemento.cita_id == cita_id:
                cola.pop(i)
                heapq.heapify(cola)
                del cls._elementos_por_cita[cita_id]
                return True
        
        return False
    
    @classmethod
    def listar_cola(cls, negocio_id: str) -> List[Dict[str, Any]]:
        """Lista todos los elementos de la cola ordenados."""
        if negocio_id not in cls._colas:
            return []
        
        cola_ordenada = sorted(cls._colas[negocio_id])
        return [
            {
                "posicion": i + 1,
                "cita_id": e.cita_id,
                "usuario_id": e.usuario_id,
                "es_premium": e.es_premium,
                "prioridad": "premium" if e.es_premium else "normal",
                "timestamp": datetime.fromtimestamp(e.timestamp).isoformat()
            }
            for i, e in enumerate(cola_ordenada)
        ]
    
    @classmethod
    def tamanio_cola(cls, negocio_id: str) -> int:
        """Retorna el tamanio de la cola."""
        return len(cls._colas.get(negocio_id, []))
    
    @classmethod
    def estadisticas(cls, negocio_id: str) -> Dict[str, Any]:
        """Obtiene estadisticas de la cola."""
        cola = cls._colas.get(negocio_id, [])
        premium = sum(1 for e in cola if e.es_premium)
        normal = len(cola) - premium
        
        return {
            "negocio_id": negocio_id,
            "total": len(cola),
            "premium": premium,
            "normal": normal,
            "siguiente": cls.ver_siguiente(negocio_id).cita_id if cola else None
        }
    
    @classmethod
    def limpiar(cls, negocio_id: Optional[str] = None) -> None:
        """Limpia la cola."""
        if negocio_id:
            if negocio_id in cls._colas:
                for e in cls._colas[negocio_id]:
                    if e.cita_id in cls._elementos_por_cita:
                        del cls._elementos_por_cita[e.cita_id]
                del cls._colas[negocio_id]
        else:
            cls._colas.clear()
            cls._elementos_por_cita.clear()


class ServicioPrioridad:
    """
    Servicio para gestionar la prioridad de citas.
    """
    
    @staticmethod
    async def agregar_a_cola(
        cita_id: str,
        negocio_id: str,
        usuario_id: str,
        es_premium: bool = False,
        datos: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Agrega una cita a la cola con prioridad.
        
        Args:
            cita_id: ID de la cita
            negocio_id: ID del negocio
            usuario_id: ID del usuario
            es_premium: Si el negocio tiene suscripcion premium
            datos: Datos adicionales
            
        Returns:
            Informacion de la posicion en cola
        """
        elemento = ElementoCola.crear(
            cita_id=cita_id,
            negocio_id=negocio_id,
            usuario_id=usuario_id,
            es_premium=es_premium,
            datos=datos
        )
        
        posicion = ColaPremium.agregar(elemento)
        total = ColaPremium.tamanio_cola(negocio_id)
        
        return {
            "cita_id": cita_id,
            "posicion": posicion,
            "total_en_cola": total,
            "es_premium": es_premium,
            "mensaje": f"En posicion {posicion} de {total}" + 
                      (" (prioridad premium)" if es_premium else "")
        }
    
    @staticmethod
    async def obtener_siguiente(negocio_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene la siguiente cita a atender."""
        elemento = ColaPremium.siguiente(negocio_id)
        if not elemento:
            return None
        
        return {
            "cita_id": elemento.cita_id,
            "usuario_id": elemento.usuario_id,
            "es_premium": elemento.es_premium,
            "datos": elemento.datos
        }
    
    @staticmethod
    async def consultar_posicion(cita_id: str) -> Dict[str, Any]:
        """Consulta la posicion de una cita."""
        posicion = ColaPremium.obtener_posicion(cita_id)
        
        if posicion == -1:
            return {
                "cita_id": cita_id,
                "en_cola": False,
                "mensaje": "La cita no esta en la cola"
            }
        
        negocio_id = ColaPremium._elementos_por_cita.get(cita_id)
        total = ColaPremium.tamanio_cola(negocio_id) if negocio_id else 0
        
        return {
            "cita_id": cita_id,
            "en_cola": True,
            "posicion": posicion,
            "total": total,
            "mensaje": f"Posicion {posicion} de {total}"
        }
    
    @staticmethod
    async def cancelar_cita_cola(cita_id: str) -> bool:
        """Remueve una cita de la cola."""
        return ColaPremium.remover(cita_id)
    
    @staticmethod
    async def obtener_cola_negocio(negocio_id: str) -> Dict[str, Any]:
        """Obtiene el estado completo de la cola de un negocio."""
        return {
            "negocio_id": negocio_id,
            "estadisticas": ColaPremium.estadisticas(negocio_id),
            "cola": ColaPremium.listar_cola(negocio_id)
        }
