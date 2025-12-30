from typing import Optional, Dict, Any, List
from fastapi import UploadFile
import json

from app.llm.gemini_adapter import GeminiAdapter
from app.mcp.herramientas import obtener_herramientas_disponibles, obtener_definiciones_herramientas


class AIOrchestrator:
    """
    Orquestador principal de IA que maneja:
    - Procesamiento de mensajes y archivos
    - Integración con modelos LLM (Gemini)
    - Ejecución de herramientas MCP
    - Gestión del contexto conversacional
    """
    
    def __init__(self):
        self.gemini_adapter = GeminiAdapter()
        self.herramientas = obtener_herramientas_disponibles()
        self.contexto_conversacion: List[Dict[str, Any]] = []
        
    def _obtener_definiciones_herramientas(self) -> List[Dict[str, Any]]:
        """
        Retorna las definiciones de herramientas en formato compatible con el LLM.
        """
        return obtener_definiciones_herramientas()
    
    async def _ejecutar_herramienta(self, nombre: str, argumentos: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ejecuta una herramienta MCP por nombre con los argumentos proporcionados.
        """
        print(f"🔧 EJECUTANDO HERRAMIENTA: {nombre}")
        print(f"📝 ARGUMENTOS: {argumentos}")
        
        if nombre not in self.herramientas:
            return {
                "error": f"Herramienta '{nombre}' no encontrada",
                "disponibles": list(self.herramientas.keys())
            }
        
        try:
            import inspect
            herramienta = self.herramientas[nombre]
            
            # Verificar si la herramienta es una coroutine (async)
            if inspect.iscoroutinefunction(herramienta):
                resultado = await herramienta(argumentos)
            else:
                resultado = herramienta(argumentos)
            
            print(f"✅ RESULTADO DE {nombre}: {resultado}")
            
            return {
                "exito": True,
                "herramienta": nombre,
                "resultado": resultado
            }
        except Exception as e:
            print(f"❌ ERROR EN {nombre}: {str(e)}")
            return {
                "exito": False,
                "herramienta": nombre,
                "error": str(e)
            }
    
    async def _procesar_archivo(self, file: UploadFile) -> Dict[str, Any]:
        """
        Procesa un archivo subido y determina qué hacer con él.
        """
        contenido = await file.read()
        tipo_mime = file.content_type or ""
        
        resultado = {await 
            "tipo": "desconocido",
            "contenido": None,
            "texto_extraido": None,
            "error": None
        }
        
        try:
            # Procesar imágenes
            if tipo_mime.startswith("image/"):
                resultado["tipo"] = "imagen"
                resultado["contenido"] = contenido
                # Extraer texto si es necesario (OCR)
                try:
                    texto = await self.gemini_adapter.extraer_texto_imagen(contenido)
                    resultado["texto_extraido"] = texto
                except Exception as e:
                    resultado["error"] = f"Error al extraer texto de imagen: {str(e)}"
            
            # Procesar PDFs
            elif tipo_mime == "application/pdf":
                resultado["tipo"] = "pdf"
                resultado["contenido"] = contenido
                try:
                    texto = await self.gemini_adapter.extraer_texto_pdf(contenido)
                    resultado["texto_extraido"] = texto
                except Exception as e:
                    resultado["error"] = f"Error al extraer texto de PDF: {str(e)}"
            
            # Procesar audio
            elif tipo_mime.startswith("audio/"):
                resultado["tipo"] = "audio"
                resultado["contenido"] = contenido
                try:
                    texto = await self.gemini_adapter.extraer_texto_audio(contenido)
                    resultado["texto_extraido"] = texto
                except Exception as e:
                    resultado["error"] = f"Error al transcribir audio: {str(e)}"
            
            else:
                resultado["error"] = f"Tipo de archivo no soportado: {tipo_mime}"
        
        except Exception as e:
            resultado["error"] = f"Error al procesar archivo: {str(e)}"
        
        return resultado
    
    async def _procesar_respuesta_con_herramientas(
        self, 
        respuesta: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Procesa la respuesta del LLM y ejecuta herramientas si es necesario.
        """
        print(f"📨 PROCESANDO RESPUESTA LLM: {respuesta}")
        
        respuesta_final = {
            "mensaje": "",
            "herramientas_ejecutadas": [],
            "requiere_mas_interaccion": False
        }
        
        for item in respuesta:
            # Si es un mensaje de texto directo
            if "content" in item:
                respuesta_final["mensaje"] += item["content"]
                print(f"💬 TEXTO RECIBIDO: {item['content'][:100]}...")
            
            # Si es una llamada a función/herramienta
            elif "function_call" in item:
                fc = item["function_call"]
                nombre_herramienta = fc.get("name", "")
                argumentos = fc.get("arguments", {})
                
                print(f"🎯 FUNCTION CALL DETECTADO: {nombre_herramienta}")
                
                # Ejecutar la herramienta
                resultado_herramienta = await self._ejecutar_herramienta(
                    nombre_herramienta, 
                    argumentos
                )
                
                respuesta_final["herramientas_ejecutadas"].append(resultado_herramienta)
                
                # Si la herramienta se ejecutó con éxito, agregar el resultado al contexto
                if resultado_herramienta.get("exito"):
                    # Aquí podrías volver a llamar al LLM con el resultado para generar una respuesta natural
                    respuesta_final["requiere_mas_interaccion"] = True
        
        print(f"📤 RESPUESTA FINAL PROCESADA: {len(respuesta_final['herramientas_ejecutadas'])} herramientas ejecutadas")
        return respuesta_final
    
    async def manejar_chat(
        self, 
        mensaje: str, 
        file: Optional[UploadFile] = None,
        mantener_contexto: bool = True,
        herramientas_filtradas: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Maneja una interacción de chat completa.
        
        Args:
            mensaje: El mensaje del usuario
            file: Archivo opcional adjunto
            mantener_contexto: Si debe mantener el historial de conversación
            herramientas_filtradas: Lista de herramientas permitidas (opcional)
        
        Returns:
            Dict con la respuesta y metadatos
        """
        try:
            # Procesar archivo si existe
            info_archivo = None
            if file:
                info_archivo = await self._procesar_archivo(file)
                
                # Si se extrajo texto del archivo, agregarlo al mensaje
                if info_archivo.get("texto_extraido"):
                    mensaje = f"{mensaje}\n\n[Contenido extraído del archivo: {info_archivo['texto_extraido']}]"
            
            # Obtener definiciones de herramientas
            herramientas = herramientas_filtradas if herramientas_filtradas else self._obtener_definiciones_herramientas()
            
            # Llamar al modelo LLM
            respuesta_llm = await self.gemini_adapter.chat(
                mensaje=mensaje,
                herramienta=herramientas if herramientas else None,
                contexto=self.contexto_conversacion if mantener_contexto else None
            )
            
            # Procesar la respuesta y ejecutar herramientas si es necesario
            respuesta_procesada = await self._procesar_respuesta_con_herramientas(respuesta_llm)
            
            # Actualizar contexto si es necesario
            if mantener_contexto:
                self.contexto_conversacion.append({
                    "role": "user",
                    "content": mensaje
                })
                self.contexto_conversacion.append({
                    "role": "assistant",
                    "content": respuesta_procesada["mensaje"]
                })
            
            # Si se ejecutaron herramientas y se requiere más interacción
            if respuesta_procesada["requiere_mas_interaccion"]:
                # Construir mensaje con resultados de herramientas
                resultados_herramientas = "\n".join([
                    f"Resultado de {h['herramienta']}: {json.dumps(h.get('resultado', {}), ensure_ascii=False)}"
                    for h in respuesta_procesada["herramientas_ejecutadas"]
                    if h.get("exito")
                ])
                
                # Volver a llamar al LLM para generar respuesta natural
                respuesta_final_llm = await self.gemini_adapter.chat(
                    mensaje=f"Basándote en estos resultados, genera una respuesta natural para el usuario:\n{resultados_herramientas}",
                    contexto=self.contexto_conversacion if mantener_contexto else None
                )
                
                if respuesta_final_llm and respuesta_final_llm[0].get("content"):
                    respuesta_procesada["mensaje"] = respuesta_final_llm[0]["content"]
            
            return {
                "exito": True,
                "respuesta": respuesta_procesada["mensaje"],
                "herramientas_ejecutadas": respuesta_procesada["herramientas_ejecutadas"],
                "archivo_procesado": info_archivo,
                "contexto_mantenido": mantener_contexto
            }
        
        except Exception as e:
            return {
                "exito": False,
                "error": str(e),
                "respuesta": "Lo siento, hubo un error al procesar tu solicitud."
            }
    
    def limpiar_contexto(self):
        """Limpia el historial de conversación."""
        self.contexto_conversacion = []
    
    def obtener_contexto(self) -> List[Dict[str, Any]]:
        """Retorna el contexto actual de la conversación."""
        return self.contexto_conversacion


# Instancia global del orquestador
_orquestador_global = None

def obtener_orquestador() -> AIOrchestrator:
    """Retorna la instancia singleton del orquestador."""
    global _orquestador_global
    if _orquestador_global is None:
        _orquestador_global = AIOrchestrator()
    return _orquestador_global


# Función de compatibilidad con la API existente
async def manejar_chat(
    mensaje: str,
    usuario_id: Optional[str] = None,
    contexto: Optional[Dict[str, Any]] = None,
    archivo: Optional[dict] = None
) -> Dict[str, Any]:
    """
    Función wrapper para manejar requests del endpoint de chat.
    
    Args:
        mensaje: Mensaje del usuario
        usuario_id: ID del usuario (opcional)
        contexto: Contexto con IDs de negocio, servicio, estación (opcional)
        archivo: Diccionario con tipo y datos del archivo en base64 (opcional)
    """
    orquestador = obtener_orquestador()
    
    # Enriquecer el mensaje con el contexto si está disponible
    mensaje_enriquecido = mensaje
    contexto_actual = contexto.copy() if contexto else {}
    
    # Si no hay usuario_id, usar un ID de prueba
    if not usuario_id:
        usuario_id = "00000000-0000-0000-0000-000000000001"  # Cliente de prueba
    
    # Agregar la fecha actual al contexto
    from datetime import datetime
    fecha_actual = datetime.now().strftime('%Y-%m-%d')
    mensaje_enriquecido += f"\n[FECHA ACTUAL: {fecha_actual}]"
    
    # Buscar servicios mencionados en el historial si aún no hay servicio_id
    if not contexto_actual.get('servicio_id') and orquestador.contexto_conversacion:
        mensaje_lower = mensaje.lower()
        # Buscar en el historial de conversación
        for conv in reversed(orquestador.contexto_conversacion):
            if conv.get('role') == 'assistant':
                # Buscar en el contenido si hay menciones de servicios
                contenido = conv.get('content', '')
                # Si el usuario menciona un servicio específico, buscar en resultados previos
                if 'servicio' in mensaje_lower:
                    # Buscar resultados de obtener_servicios en herramientas ejecutadas
                    for h_conv in reversed(orquestador.contexto_conversacion):
                        if 'obtener_servicios' in str(h_conv):
                            # Intentar extraer servicios del contexto
                            break
    
    # Filtrar herramientas disponibles según el contexto
    herramientas_filtradas = None
    from app.mcp.herramientas import obtener_definiciones_herramientas
    
    if contexto_actual:
        if contexto_actual.get('fecha') and contexto_actual.get('hora_inicio') and contexto_actual.get('hora_fin'):
            # Si ya tiene horario seleccionado, solo permitir crear_cita
            print("🔒 FILTRANDO: Solo permitir crear_cita")
            todas_herramientas = obtener_definiciones_herramientas()
            herramientas_filtradas = [h for h in todas_herramientas if h.get('nombre') in ['crear_cita']]
            print(f"✅ HERRAMIENTAS FILTRADAS: {[h.get('nombre') for h in herramientas_filtradas]}")
        elif contexto_actual.get('estacion_id'):
            # Si ya tiene estación, solo permitir ver_horarios_disponibles y crear_cita
            print("🔒 FILTRANDO: Solo permitir ver_horarios_disponibles y crear_cita")
            todas_herramientas = obtener_definiciones_herramientas()
            herramientas_filtradas = [h for h in todas_herramientas if h.get('nombre') in ['ver_horarios_disponibles', 'crear_cita']]
            print(f"✅ HERRAMIENTAS FILTRADAS: {[h.get('nombre') for h in herramientas_filtradas]}")
        elif contexto_actual.get('servicio_id'):
            # Si ya tiene servicio, solo permitir obtener_estaciones
            print("🔒 FILTRANDO: Solo permitir obtener_estaciones")
            todas_herramientas = obtener_definiciones_herramientas()
            herramientas_filtradas = [h for h in todas_herramientas if h.get('nombre') in ['obtener_estaciones', 'ver_horarios_disponibles', 'crear_cita']]
            print(f"✅ HERRAMIENTAS FILTRADAS: {[h.get('nombre') for h in herramientas_filtradas]}")
        elif contexto_actual.get('negocio_id'):
            # Si ya tiene negocio, solo permitir obtener_servicios
            print("🔒 FILTRANDO: Solo permitir obtener_servicios")
            todas_herramientas = obtener_definiciones_herramientas()
            herramientas_filtradas = [h for h in todas_herramientas if h.get('nombre') in ['obtener_servicios', 'obtener_estaciones', 'ver_horarios_disponibles', 'crear_cita']]
            print(f"✅ HERRAMIENTAS FILTRADAS: {[h.get('nombre') for h in herramientas_filtradas]}")
    
    if contexto_actual:
        info_contexto = []
        if contexto_actual.get('usuario_id'):
            usuario_id = contexto_actual['usuario_id']
        if contexto_actual.get('negocio_id'):
            info_contexto.append(f"[IMPORTANTE: El usuario ya seleccionó el negocio con ID: {contexto_actual['negocio_id']}. DEBES llamar a obtener_servicios con este ID inmediatamente. NO llames a buscar_negocios de nuevo.]")
        if contexto_actual.get('servicio_id'):
            info_contexto.append(f"[IMPORTANTE: El usuario ya seleccionó el servicio con ID: {contexto_actual['servicio_id']}. DEBES llamar a obtener_estaciones con el negocio_id: {contexto_actual.get('negocio_id')} inmediatamente. NO llames a obtener_servicios de nuevo.]")
        if contexto_actual.get('estacion_id') and not contexto_actual.get('fecha'):
            info_contexto.append(f"[IMPORTANTE: El usuario ya seleccionó la estación con ID: {contexto_actual['estacion_id']}. DEBES llamar a ver_horarios_disponibles con negocio_id: {contexto_actual.get('negocio_id')}, servicio_id: {contexto_actual.get('servicio_id')} y estacion_id: {contexto_actual['estacion_id']} inmediatamente. NO llames a obtener_estaciones de nuevo.]")
        if contexto_actual.get('fecha') and contexto_actual.get('hora_inicio') and contexto_actual.get('hora_fin'):
            info_contexto.append(f"[IMPORTANTE: El usuario ya seleccionó el horario: {contexto_actual['fecha']} de {contexto_actual['hora_inicio']} a {contexto_actual['hora_fin']}. DEBES llamar a crear_cita con todos los datos: cliente_id: {usuario_id}, negocio_id: {contexto_actual.get('negocio_id')}, servicio_id: {contexto_actual.get('servicio_id')}, estacion_id: {contexto_actual.get('estacion_id')}, fecha: {contexto_actual['fecha']}, hora_inicio: {contexto_actual['hora_inicio']}, hora_fin: {contexto_actual['hora_fin']} inmediatamente. NO pidas confirmación, crea la cita directamente.]")
        
        if info_contexto:
            mensaje_enriquecido = f"{mensaje}\n\n" + "\n".join(info_contexto)
    
    # Agregar usuario_id al mensaje si está disponible
    if usuario_id:
        mensaje_enriquecido += f"\n[CONTEXTO: Cliente ID: {usuario_id}]"
    
    print(f"📩 MENSAJE ENRIQUECIDO: {mensaje_enriquecido}")
    
    # Por ahora, ignoramos archivo (lo procesaremos después)
    resultado = await orquestador.manejar_chat(
        mensaje_enriquecido, 
        None, 
        True, 
        herramientas_filtradas
    )
    
    return resultado


