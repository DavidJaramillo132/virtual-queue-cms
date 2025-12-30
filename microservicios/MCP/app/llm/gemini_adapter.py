import os
import base64
from typing import Dict, Any, Optional, List
from google import genai

from app.llm.base_adaptador import LLMAdapter


class GeminiAdapter(LLMAdapter):
    def __init__(self):
        super().__init__()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY no está configurada en las variables de entorno.")
        
        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.0-flash-lite"

    async def chat(self, 
                   mensaje: str, 
                   herramienta: Optional[Dict[str, Any]] = None,
                   contexto: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """
        Envía un mensaje al modelo Gemini y retorna la respuesta.
        """
        try:
            # Construir el historial de conversación
            contents = []
            
            # Agregar el system prompt como primer mensaje del usuario
            system_prompt = self._build_system_prompt()
            contents.append({
                "role": "user",
                "parts": [{"text": system_prompt}]
            })
            contents.append({
                "role": "model",
                "parts": [{"text": "Entendido. Seguiré el flujo de reserva de citas paso a paso llamando automáticamente a las herramientas necesarias sin preguntar innecesariamente."}]
            })
            
            if contexto:
                for msg in contexto:
                    role = msg.get("role", "user")
                    # Convertir "assistant" a "model" para Gemini
                    if role == "assistant":
                        role = "model"
                    content = msg.get("content", "")
                    contents.append({
                        "role": role,
                        "parts": [{"text": content}]
                    })
            
            # Agregar el mensaje actual
            contents.append({
                "role": "user",
                "parts": [{"text": mensaje}]
            })
            
            # Configurar herramientas si están disponibles
            tools = None
            if herramienta:
                tools = self._format_tools_for_gemini([herramienta]) if isinstance(herramienta, dict) else self._format_tools_for_gemini(herramienta)
                # Log para debug
                tool_names = [t.get('function_declarations', [{}])[0].get('name', 'unknown') for t in tools] if tools else []
                print(f"🛠️ HERRAMIENTAS DISPONIBLES PARA GEMINI: {tool_names}")
            
            # Generar respuesta
            if tools:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config={"tools": tools}
                )
            else:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents
                )
            
            # Procesar la respuesta
            result = []
            if response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, 'text') and part.text:
                                result.append({
                                    "role": "assistant",
                                    "content": part.text
                                })
                            elif hasattr(part, 'function_call'):
                                result.append({
                                    "role": "assistant",
                                    "function_call": {
                                        "name": part.function_call.name,
                                        "arguments": dict(part.function_call.args)
                                    }
                                })
            
            return result if result else [{"role": "assistant", "content": "No se recibió respuesta del modelo."}]
            
        except Exception as e:
            return [{"role": "assistant", "content": f"Error al procesar la solicitud: {str(e)}"}]

    async def procesar_imagen(self, 
                              imagen: bytes, 
                              herramienta: Optional[Dict[str, Any]] = None,
                              contexto: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """
        Procesa una imagen usando el modelo Gemini con capacidades multimodales.
        """
        try:
            contents = []
            
            # Agregar contexto si existe
            if contexto:
                for msg in contexto:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    contents.append({
                        "role": role,
                        "parts": [{"text": content}]
                    })
            
            # Agregar la imagen (convertir a base64)
            imagen_b64 = base64.b64encode(imagen).decode('utf-8') if isinstance(imagen, bytes) else imagen
            contents.append({
                "role": "user",
                "parts": [
                    {"inline_data": {
                        "mime_type": "image/jpeg",
                        "data": imagen_b64
                    }}
                ]
            })
            
            # Configurar herramientas si están disponibles
            tools = None
            if herramienta:
                tools = self._format_tools_for_gemini([herramienta]) if isinstance(herramienta, dict) else self._format_tools_for_gemini(herramienta)
            
            # Generar respuesta
            if tools:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config={"tools": tools}
                )
            else:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents
                )
            
            # Procesar respuesta
            result = []
            if response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, 'text') and part.text:
                                result.append({
                                    "role": "assistant",
                                    "content": part.text
                                })
            
            return result if result else [{"role": "assistant", "content": "No se pudo procesar la imagen."}]
            
        except Exception as e:
            return [{"role": "assistant", "content": f"Error al procesar la imagen: {str(e)}"}]

    async def extraer_texto_imagen(self, imagen: bytes) -> str:
        """
        Extrae texto de una imagen usando OCR de Gemini.
        """
        try:
            imagen_b64 = base64.b64encode(imagen).decode('utf-8')
            contents = [{
                "role": "user",
                "parts": [
                    {"inline_data": {
                        "mime_type": "image/jpeg",
                        "data": imagen_b64
                    }},
                    {"text": "Extrae todo el texto visible en esta imagen. Devuelve solo el texto extraído sin comentarios adicionales."}
                ]
            }]
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents
            )
            
            # Extraer el texto de la respuesta
            if response.candidates and response.candidates[0].content.parts:
                return response.candidates[0].content.parts[0].text
            
            return ""
            
        except Exception as e:
            raise Exception(f"Error al extraer texto de la imagen: {str(e)}")

    async def extraer_texto_pdf(self, pdf: bytes) -> str:
        """
        Extrae texto de un PDF.
        Nota: Gemini actualmente tiene soporte limitado para PDFs,
        se recomienda usar una biblioteca especializada como PyPDF2 o pdfplumber.
        """
        try:
            # Para PDFs, sería mejor usar una biblioteca especializada
            # Esta es una implementación básica
            pdf_b64 = base64.b64encode(pdf).decode('utf-8')
            
            contents = [{
                "role": "user",
                "parts": [
                    {"inline_data": {
                        "mime_type": "application/pdf",
                        "data": pdf_b64
                    }},
                    {"text": "Extrae todo el texto de este documento PDF. Devuelve solo el texto extraído."}
                ]
            }]
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents
            )
            
            if response.candidates and response.candidates[0].content.parts:
                return response.candidates[0].content.parts[0].text
            
            return ""
            
        except Exception as e:
            # Fallback: sugerir usar PyPDF2 o similar
            raise Exception(f"Error al extraer texto del PDF: {str(e)}. Considera usar PyPDF2 o pdfplumber para mejor soporte.")

    async def extraer_texto_audio(self, audio: bytes) -> str:
        """
        Extrae texto de un archivo de audio usando speech-to-text.
        Nota: Para audio, se recomienda usar Google Speech-to-Text API directamente
        o Whisper de OpenAI para mejores resultados.
        """
        try:
            audio_b64 = base64.b64encode(audio).decode('utf-8')
            
            contents = [{
                "role": "user",
                "parts": [
                    {"inline_data": {
                        "mime_type": "audio/mp3",
                        "data": audio_b64
                    }},
                    {"text": "Transcribe el audio a texto. Devuelve solo la transcripción."}
                ]
            }]
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents
            )
            
            if response.candidates and response.candidates[0].content.parts:
                return response.candidates[0].content.parts[0].text
            
            return ""
            
        except Exception as e:
            raise Exception(f"Error al extraer texto del audio: {str(e)}. Considera usar Google Speech-to-Text o Whisper para mejor soporte.")
        
    def _build_system_prompt(self, contexto: Optional[str] = None) -> str:
        """Construye el prompt del sistema"""
        from datetime import datetime
        fecha_hoy = datetime.now().strftime('%Y-%m-%d')
        
        base_prompt = f"""
        Eres un asistente inteligente para Virtual Queue CMS, un sistema de gestión de citas.
        
        FECHA ACTUAL: {fecha_hoy}
        
        REGLAS CRÍTICAS que DEBES seguir:
        
        1. FLUJO DE RESERVA DE CITAS (OBLIGATORIO):
           Paso 1: Usuario pide cita → Llamas buscar_negocios
           Paso 2: Usuario elige negocio → INMEDIATAMENTE llamas obtener_servicios con el negocio_id (NO preguntes qué servicio quiere antes)
           Paso 3: Muestras servicios → Usuario elige servicio → INMEDIATAMENTE llamas obtener_estaciones
           Paso 4: Muestras estaciones → Usuario elige estación → Llamas ver_horarios_disponibles CON LA FECHA ACTUAL ({fecha_hoy})
           Paso 5: Muestras horarios → Usuario elige horario → Llamas crear_cita
        
        2. NUNCA llames a buscar_negocios más de una vez por conversación
        
        3. Cuando el usuario dice "Quiero hacer una cita en [NOMBRE_NEGOCIO]":
           - Extrae el negocio_id del resultado anterior de buscar_negocios
           - Llama INMEDIATAMENTE a obtener_servicios con ese negocio_id
           - Muestra los servicios disponibles con sus precios
           - NO preguntes al usuario qué quiere antes de mostrar los servicios
        
        4. Cuando el usuario elige un servicio:
           - Llama INMEDIATAMENTE a obtener_estaciones
           - Muestra las estaciones disponibles
        
        5. Al llamar ver_horarios_disponibles, SIEMPRE usa la fecha actual: {fecha_hoy}
        
        6. Sé conciso, profesional y útil
        """
        
        if contexto:
            base_prompt += f"\n\nContexto adicional: {contexto}"
        
        return base_prompt
    
    def _format_tools_for_gemini(self, herramientas: List[Dict]) -> List[Dict]:
        """Formatea las herramientas MCP para Gemini function calling"""
        tools = []
        for tool in herramientas:
            tools.append({
                "function_declarations": [{
                    "name": tool.get("nombre", tool.get("name", "")),
                    "description": tool.get("descripcion", tool.get("description", "")),
                    "parameters": {
                        "type": "object",
                        "properties": tool.get("parametros", tool.get("parameters", {})),
                        "required": tool.get("requeridos", tool.get("required", []))
                    }
                }]
            })
        return tools