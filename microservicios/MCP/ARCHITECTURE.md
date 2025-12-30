# Arquitectura del Microservicio MCP

Este documento explica el funcionamiento interno del microservicio MCP (Model Context Protocol), su arquitectura y la funcion de cada archivo.

## Tabla de Contenidos

1. [Vision General](#vision-general)
2. [Flujo de Ejecucion](#flujo-de-ejecucion)
3. [Componentes Principales](#componentes-principales)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Patrones de Diseno](#patrones-de-diseno)

---

## Vision General

El microservicio MCP es un asistente de IA que:
- Procesa lenguaje natural usando modelos LLM (Gemini)
- Ejecuta herramientas especificas para gestionar citas
- Procesa archivos multimodales (imagenes, PDFs, audio)
- Mantiene contexto conversacional
- Se integra con servicios backend via API REST

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Frontend)                   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP POST /api/chat
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Application (main.py)              │
│  ┌───────────────────────────────────────────────────┐  │
│  │          Chat Controller (chat_controller.py)     │  │
│  └────────────────────┬──────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         AI Orchestrator (ai_orchestrator.py)            │
│  ┌─────────────────┐  ┌────────────────────────────┐   │
│  │ Procesar Archivo│  │  Procesar Conversacion     │   │
│  │ (OCR/PDF/Audio) │  │  (Mantener Contexto)       │   │
│  └─────────────────┘  └────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           LLM Adapter (gemini_adapter.py)       │   │
│  │  - Envia mensaje + contexto                     │   │
│  │  - Recibe respuesta del modelo                  │   │
│  │  - Identifica llamadas a herramientas           │   │
│  └────────────────┬────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐      ┌─────────────────────┐
│ Google Gemini│      │ Herramientas MCP    │
│   API        │      │ (herramientas/)     │
└──────────────┘      │                     │
                      │ - ver_horarios      │
                      │ - crear_cita        │
                      │ - cancelar_cita     │
                      │ - consultar_citas   │
                      │ - buscar_negocios   │
                      │ - obtener_servicios │
                      │ - obtener_info      │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │  REST API Backend    │
                      │  (port 3000)         │
                      └──────────────────────┘
```

---

## Flujo de Ejecucion

### 1. Usuario envia mensaje

```
POST /api/chat
{
  "message": "Necesito agendar una cita para mañana",
  "file": <opcional>
}
```

### 2. Chat Controller recibe la peticion

**Archivo:** `app/api/chat_controller.py`

```python
async def chat(message: str, file: UploadFile | None):
    response = await manejar_chat(message, file)
    return response
```

### 3. Orquestador procesa la solicitud

**Archivo:** `app/orchestrator/ai_orchestrator.py`

**Pasos:**
1. **Procesar archivo (si existe)**
   - Detectar tipo (imagen/PDF/audio)
   - Extraer texto usando el LLM adapter
   - Agregar texto extraido al mensaje

2. **Obtener definiciones de herramientas**
   - Cargar lista de herramientas disponibles
   - Formatear para el LLM

3. **Enviar al LLM**
   - Construir mensaje con contexto
   - Incluir herramientas disponibles
   - Recibir respuesta

4. **Procesar respuesta**
   - Si es texto directo: retornar al usuario
   - Si es llamada a herramienta: ejecutar y generar respuesta

5. **Actualizar contexto**
   - Guardar mensaje del usuario
   - Guardar respuesta del asistente

### 4. LLM Adapter interactua con Gemini

**Archivo:** `app/llm/gemini_adapter.py`

```python
async def chat(mensaje, herramienta, contexto):
    # Construir historial
    contents = contexto + [{"role": "user", "parts": [{"text": mensaje}]}]
    
    # Configurar herramientas
    config = {"tools": herramientas_formateadas}
    
    # Llamar a Gemini
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=contents,
        config=config
    )
    
    # Procesar respuesta
    return parsed_response
```

### 5. Ejecutar herramientas (si es necesario)

**Archivo:** `app/mcp/herramientas/crear_cita.py` (ejemplo)

```python
async def crear_cita(data):
    # Validar parametros
    # Hacer llamada HTTP al backend
    response = await httpx.post(f"{REST_API_URL}/citas", json=data)
    # Retornar resultado
    return {"exito": True, "cita": response.json()}
```

### 6. Retornar respuesta al usuario

```json
{
  "exito": true,
  "respuesta": "Tu cita ha sido agendada exitosamente para mañana a las 10:00 AM",
  "herramientas_ejecutadas": [{
    "herramienta": "crear_cita",
    "resultado": {...}
  }]
}
```

---

## Componentes Principales

### 1. FastAPI Application (`app/main.py`)

**Funcion:** Punto de entrada de la aplicacion

**Responsabilidades:**
- Configurar FastAPI
- Registrar routers
- Configurar CORS
- Gestionar lifecycle (startup/shutdown)
- Validar configuracion al inicio
- Exponer endpoints de informacion

**Codigo clave:**
```python
app = FastAPI(
    title="Virtual Queue CMS - Microservicio MCP",
    lifespan=lifespan  # Gestiona startup/shutdown
)

# Configurar CORS para permitir requests del frontend
app.add_middleware(CORSMiddleware, allow_origins=["*"])

# Registrar router de chat
app.include_router(chat_router, prefix="/api")
```

**Endpoints expuestos:**
- `GET /` - Informacion del servicio
- `GET /health` - Health check
- `GET /api/info` - Capacidades
- `POST /api/chat` - Chat (via router)

---

### 2. Configuration (`app/config.py`)

**Funcion:** Configuracion centralizada del microservicio

**Responsabilidades:**
- Cargar variables de entorno
- Proveer valores por defecto
- Validar configuracion critica
- Exponer configuracion a toda la aplicacion

**Variables principales:**
```python
class Config:
    # APIs de LLM
    GEMINI_API_KEY: Optional[str]
    OPENAI_API_KEY: Optional[str]
    
    # URLs de servicios backend
    REST_API_URL: str = "http://localhost:3000/api"
    GRAPHQL_API_URL: str = "http://localhost:4000/graphql"
    WEBSOCKET_URL: str = "ws://localhost:8080/ws"
    
    # Configuracion de app
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    API_TIMEOUT: int = 10
    MAX_FILE_SIZE: int = 10485760  # 10MB
```

**Validacion:**
```python
def validate(cls):
    if not cls.GEMINI_API_KEY and not cls.OPENAI_API_KEY:
        raise ValueError("Al menos una API key debe estar configurada")
```

---

### 3. Chat Controller (`app/api/chat_controller.py`)

**Funcion:** Controlador del endpoint de chat

**Responsabilidades:**
- Recibir requests HTTP
- Validar parametros de entrada
- Delegar al orquestador
- Retornar respuesta formateada

**Codigo:**
```python
router = APIRouter()

@router.post("/chat")
async def chat(
    message: str = Form(...),           # Mensaje requerido
    file: UploadFile | None = File(None)  # Archivo opcional
):
    response = await manejar_chat(message, file)
    return response
```

**Input:**
- `message`: String con el mensaje del usuario
- `file`: Archivo opcional (imagen/PDF/audio)

**Output:**
```json
{
  "exito": true,
  "respuesta": "Texto de respuesta",
  "herramientas_ejecutadas": [...],
  "archivo_procesado": {...}
}
```

---

### 4. AI Orchestrator (`app/orchestrator/ai_orchestrator.py`)

**Funcion:** Orquestador principal que coordina todo el flujo

**Responsabilidades:**
- Gestionar contexto conversacional
- Procesar archivos multimodales
- Coordinar LLM y herramientas
- Manejar llamadas a funciones
- Generar respuestas naturales

**Clase principal:**
```python
class AIOrchestrator:
    def __init__(self):
        self.gemini_adapter = GeminiAdapter()
        self.herramientas = obtener_herramientas_disponibles()
        self.contexto_conversacion = []
```

**Metodos clave:**

#### `manejar_chat(mensaje, file, mantener_contexto)`
Punto de entrada principal

**Flujo:**
1. Procesar archivo si existe
2. Obtener definiciones de herramientas
3. Llamar al LLM con mensaje + contexto + herramientas
4. Procesar respuesta (texto o llamadas a funciones)
5. Ejecutar herramientas si es necesario
6. Actualizar contexto
7. Retornar respuesta

#### `_procesar_archivo(file)`
Procesa archivos adjuntos

**Soporta:**
- Imagenes (JPEG, PNG) → OCR
- PDFs → Extraccion de texto
- Audio (MP3, WAV) → Transcripcion

**Retorna:**
```python
{
    "tipo": "imagen",
    "contenido": bytes,
    "texto_extraido": "Texto encontrado...",
    "error": None
}
```

#### `_ejecutar_herramienta(nombre, argumentos)`
Ejecuta una herramienta MCP

**Flujo:**
1. Validar que la herramienta existe
2. Llamar a la funcion con argumentos
3. Capturar resultado o error
4. Retornar formato estandarizado

#### `_obtener_definiciones_herramientas()`
Retorna definiciones de herramientas para el LLM

**Formato:**
```python
{
    "nombre": "crear_cita",
    "descripcion": "Crea una nueva cita...",
    "parametros": {
        "cliente_id": {"type": "string", "description": "..."},
        ...
    },
    "requeridos": ["cliente_id", "negocio_id", ...]
}
```

#### `_procesar_respuesta_con_herramientas(respuesta)`
Procesa respuesta del LLM y ejecuta herramientas

**Logica:**
1. Iterar sobre items de la respuesta
2. Si es texto → agregar a respuesta final
3. Si es function_call → ejecutar herramienta
4. Si se ejecutaron herramientas → generar respuesta natural

**Patron Singleton:**
```python
_orquestador_global = None

def obtener_orquestador():
    global _orquestador_global
    if _orquestador_global is None:
        _orquestador_global = AIOrchestrator()
    return _orquestador_global
```

---

### 5. LLM Adapters (`app/llm/`)

#### Base Adapter (`base_adaptador.py`)

**Funcion:** Interface abstracta para adaptadores de LLM

**Proposito:**
- Definir contrato comun para todos los LLMs
- Permitir intercambiar modelos facilmente
- Garantizar metodos consistentes

**Metodos abstractos:**
```python
class LLMAdapter(ABC):
    @abstractmethod
    async def chat(mensaje, herramienta, contexto) -> List[Dict]:
        pass
    
    @abstractmethod
    async def procesar_imagen(imagen, herramienta, contexto) -> List[Dict]:
        pass
    
    @abstractmethod
    async def extraer_texto_imagen(imagen) -> str:
        pass
    
    @abstractmethod
    async def extraer_texto_pdf(pdf) -> str:
        pass
    
    @abstractmethod
    async def extraer_texto_audio(audio) -> str:
        pass
```

#### Gemini Adapter (`gemini_adapter.py`)

**Funcion:** Implementacion concreta para Google Gemini

**Responsabilidades:**
- Comunicarse con Gemini API
- Formatear mensajes para Gemini
- Procesar respuestas de Gemini
- Manejar function calling
- Procesar archivos multimodales

**Inicializacion:**
```python
def __init__(self):
    api_key = os.getenv("GEMINI_API_KEY")
    self.client = genai.Client(api_key=api_key)
    self.model_name = "gemini-1.5-flash"
```

**Metodo chat:**
```python
async def chat(mensaje, herramienta, contexto):
    # 1. Construir historial
    contents = []
    if contexto:
        for msg in contexto:
            contents.append({
                "role": msg["role"],
                "parts": [{"text": msg["content"]}]
            })
    
    # 2. Agregar mensaje actual
    contents.append({
        "role": "user",
        "parts": [{"text": mensaje}]
    })
    
    # 3. Configurar herramientas
    tools = None
    if herramienta:
        tools = self._format_tools_for_gemini(herramienta)
    
    # 4. Llamar a Gemini
    response = self.client.models.generate_content(
        model=self.model_name,
        contents=contents,
        config={"tools": [tools]} if tools else None
    )
    
    # 5. Procesar respuesta
    result = []
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if hasattr(part, 'text'):
                result.append({"role": "assistant", "content": part.text})
            elif hasattr(part, 'function_call'):
                result.append({
                    "role": "assistant",
                    "function_call": {
                        "name": part.function_call.name,
                        "arguments": dict(part.function_call.args)
                    }
                })
    
    return result
```

**Procesamiento de imagenes:**
```python
async def extraer_texto_imagen(imagen):
    # Codificar imagen en base64
    imagen_b64 = base64.b64encode(imagen).decode('utf-8')
    
    # Crear mensaje con imagen
    contents = [{
        "role": "user",
        "parts": [
            {"inline_data": {"mime_type": "image/jpeg", "data": imagen_b64}},
            {"text": "Extrae todo el texto visible en esta imagen"}
        ]
    }]
    
    # Llamar a Gemini
    response = self.client.models.generate_content(...)
    
    # Retornar texto extraido
    return response.candidates[0].content.parts[0].text
```

**Formato de herramientas:**
```python
def _format_tools_for_gemini(herramientas):
    function_declarations = []
    for tool in herramientas:
        function_declarations.append({
            "name": tool["nombre"],
            "description": tool["descripcion"],
            "parameters": {
                "type": "object",
                "properties": tool["parametros"],
                "required": tool["requeridos"]
            }
        })
    return {"function_declarations": function_declarations}
```

---

### 6. Herramientas MCP (`app/mcp/`)

#### Registro de Herramientas (`herramientas.py`)

**Funcion:** Registro central de todas las herramientas disponibles

**Responsabilidades:**
- Importar todas las herramientas
- Proveer diccionario de herramientas
- Proveer definiciones para el LLM

**Funciones principales:**

```python
def obtener_herramientas_disponibles() -> Dict[str, Callable]:
    """Retorna diccionario nombre -> funcion"""
    return {
        "ver_horarios_disponibles": ver_horarios_disponibles,
        "crear_cita": crear_cita,
        "cancelar_cita": cancelar_cita,
        "consultar_citas": consultar_citas,
        "buscar_negocios": buscar_negocios,
        "obtener_servicios": obtener_servicios,
        "obtener_info_negocio": obtener_info_negocio
    }

def obtener_definiciones_herramientas() -> List[Dict]:
    """Retorna definiciones en formato MCP"""
    return [
        {
            "nombre": "crear_cita",
            "descripcion": "Crea una nueva cita en el sistema...",
            "parametros": {
                "cliente_id": {
                    "type": "string",
                    "description": "ID del cliente (UUID)"
                },
                ...
            },
            "requeridos": ["cliente_id", "negocio_id", ...]
        },
        ...
    ]
```

#### Implementacion de Herramientas (`herramientas/*.py`)

Todas las herramientas siguen el mismo patron:

**Estructura:**
```python
async def nombre_herramienta(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Descripcion de la herramienta
    
    Args:
        data: Diccionario con parametros
    
    Returns:
        Dict con resultado
    """
    # 1. Validar parametros requeridos
    if not data.get("parametro_requerido"):
        return {"exito": False, "error": "Parametro requerido"}
    
    # 2. Preparar datos
    base_url = config.REST_API_URL
    payload = {...}
    
    # 3. Hacer llamada HTTP
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/endpoint",
                json=payload,
                timeout=config.API_TIMEOUT
            )
            response.raise_for_status()
            
            # 4. Retornar resultado
            return {
                "exito": True,
                "resultado": response.json()
            }
    
    # 5. Manejar errores
    except httpx.HTTPError as e:
        return {"exito": False, "error": str(e)}
```

**Ejemplo: crear_cita.py**

```python
async def crear_cita(data: Dict[str, Any]) -> Dict[str, Any]:
    # Validar campos requeridos
    campos_requeridos = [
        "cliente_id", "negocio_id", "servicio_id",
        "estacion_id", "fecha", "hora_inicio", "hora_fin"
    ]
    
    for campo in campos_requeridos:
        if not data.get(campo):
            return {
                "exito": False,
                "error": f"El campo '{campo}' es requerido"
            }
    
    # Preparar payload
    payload = {
        "cliente_id": data["cliente_id"],
        "negocio_id": data["negocio_id"],
        "servicio_id": data["servicio_id"],
        "estacion_id": data["estacion_id"],
        "fecha": data["fecha"],
        "hora_inicio": data["hora_inicio"],
        "hora_fin": data["hora_fin"]
    }
    
    # Llamar a API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config.REST_API_URL}/citas",
                json=payload,
                timeout=10.0
            )
            response.raise_for_status()
            
            return {
                "exito": True,
                "mensaje": "Cita creada exitosamente",
                "cita": response.json()
            }
    
    except httpx.HTTPError as e:
        return {
            "exito": False,
            "error": f"Error al crear la cita: {str(e)}"
        }
```

**Herramientas disponibles:**

1. **ver_horarios_disponibles** - Consulta horarios libres
2. **crear_cita** - Crea nueva cita
3. **cancelar_cita** - Cancela cita existente
4. **consultar_citas** - Busca citas con filtros
5. **buscar_negocios** - Busca negocios
6. **obtener_servicios** - Lista servicios de negocio
7. **obtener_info_negocio** - Info detallada de negocio

---

## Estructura de Archivos

```
MCP/
├── Dockerfile                          # Configuracion Docker
├── .dockerignore                       # Archivos a ignorar en build
├── .gitignore                          # Archivos a ignorar en git
├── .env.example                        # Template de variables de entorno
├── requirements.txt                    # Dependencias Python
├── README.md                           # Documentacion de usuario
├── ARCHITECTURE.md                     # Este archivo
│
└── app/                                # Aplicacion principal
    ├── __init__.py                     # Marca el directorio como paquete Python
    │
    ├── main.py                         # Punto de entrada de FastAPI
    │   └── Configura:
    │       - FastAPI app
    │       - CORS middleware
    │       - Routers
    │       - Lifecycle events
    │       - Endpoints raiz
    │
    ├── config.py                       # Configuracion centralizada
    │   └── Provee:
    │       - Variables de entorno
    │       - Valores por defecto
    │       - Validacion de config
    │
    ├── api/                            # Controladores HTTP
    │   └── chat_controller.py          # Endpoint de chat
    │       └── POST /api/chat
    │           - Recibe mensaje + archivo
    │           - Delega al orquestador
    │           - Retorna respuesta
    │
    ├── llm/                            # Adaptadores de modelos LLM
    │   ├── base_adaptador.py           # Interface abstracta
    │   │   └── Define metodos:
    │   │       - chat()
    │   │       - procesar_imagen()
    │   │       - extraer_texto_imagen()
    │   │       - extraer_texto_pdf()
    │   │       - extraer_texto_audio()
    │   │
    │   └── gemini_adapter.py           # Implementacion para Gemini
    │       └── Implementa:
    │           - Comunicacion con Gemini API
    │           - Function calling
    │           - Procesamiento multimodal
    │           - Formato de herramientas
    │
    ├── mcp/                            # Herramientas MCP
    │   ├── herramientas.py             # Registro central
    │   │   └── Funciones:
    │   │       - obtener_herramientas_disponibles()
    │   │       - obtener_definiciones_herramientas()
    │   │
    │   └── herramientas/               # Implementaciones
    │       ├── __init__.py             # Exportaciones
    │       ├── README.md               # Docs de herramientas
    │       │
    │       ├── ver_horarios_disponibles.py
    │       │   └── Consulta horarios disponibles en API
    │       │
    │       ├── crear_cita.py
    │       │   └── Crea nueva cita via API
    │       │
    │       ├── cancelar_cita.py
    │       │   └── Cancela cita existente
    │       │
    │       ├── consultar_citas.py
    │       │   └── Busca citas con filtros
    │       │
    │       ├── buscar_negocios.py
    │       │   └── Busca negocios en sistema
    │       │
    │       ├── obtener_servicios.py
    │       │   └── Lista servicios de negocio
    │       │
    │       └── obtener_info_negocio.py
    │           └── Info detallada de negocio
    │
    └── orchestrator/                   # Logica de orquestacion
        └── ai_orchestrator.py          # Orquestador principal
            └── Clase AIOrchestrator:
                - __init__()
                - manejar_chat()
                - _procesar_archivo()
                - _ejecutar_herramienta()
                - _obtener_definiciones_herramientas()
                - _procesar_respuesta_con_herramientas()
                - limpiar_contexto()
                - obtener_contexto()
```

---

## Patrones de Diseno

### 1. Adapter Pattern (Adaptador)

**Ubicacion:** `app/llm/`

**Proposito:** Permitir que diferentes modelos LLM se integren sin cambiar el codigo del orquestador

**Implementacion:**
```python
# Interface abstracta
class LLMAdapter(ABC):
    @abstractmethod
    async def chat(...): pass

# Implementacion concreta
class GeminiAdapter(LLMAdapter):
    async def chat(...):
        # Logica especifica de Gemini

# Uso en orquestador
self.llm_adapter = GeminiAdapter()  # Facilmente intercambiable
```

**Beneficios:**
- Facil agregar nuevos modelos (OpenAI, Claude, etc.)
- Codigo del orquestador independiente del LLM
- Misma interface para todos los modelos

---

### 2. Singleton Pattern (Instancia unica)

**Ubicacion:** `app/orchestrator/ai_orchestrator.py`

**Proposito:** Garantizar una sola instancia del orquestador para mantener estado compartido

**Implementacion:**
```python
_orquestador_global = None

def obtener_orquestador() -> AIOrchestrator:
    global _orquestador_global
    if _orquestador_global is None:
        _orquestador_global = AIOrchestrator()
    return _orquestador_global
```

**Beneficios:**
- Contexto conversacional compartido
- Memoria eficiente
- Estado consistente

---

### 3. Registry Pattern (Registro)

**Ubicacion:** `app/mcp/herramientas.py`

**Proposito:** Registro centralizado de herramientas disponibles

**Implementacion:**
```python
def obtener_herramientas_disponibles() -> Dict[str, Callable]:
    return {
        "crear_cita": crear_cita,
        "cancelar_cita": cancelar_cita,
        ...
    }
```

**Beneficios:**
- Facil agregar/remover herramientas
- Descubrimiento dinamico de herramientas
- Punto central de configuracion

---

### 4. Template Method Pattern (Metodo plantilla)

**Ubicacion:** Todas las herramientas MCP

**Proposito:** Estructura consistente para todas las herramientas

**Template:**
```python
async def herramienta(data: Dict) -> Dict:
    # 1. Validar parametros
    if not data.get("param_requerido"):
        return {"exito": False, "error": "..."}
    
    # 2. Preparar datos
    payload = {...}
    
    # 3. Ejecutar logica (llamada HTTP)
    try:
        response = await httpx.post(...)
        return {"exito": True, "resultado": ...}
    except Exception as e:
        return {"exito": False, "error": str(e)}
```

**Beneficios:**
- Codigo predecible
- Manejo de errores consistente
- Facil mantenimiento

---

### 5. Strategy Pattern (Estrategia)

**Ubicacion:** Procesamiento de archivos en orquestador

**Proposito:** Diferentes estrategias para procesar diferentes tipos de archivos

**Implementacion:**
```python
async def _procesar_archivo(file):
    if tipo_mime.startswith("image/"):
        # Estrategia para imagenes
        texto = await self.gemini_adapter.extraer_texto_imagen(contenido)
    
    elif tipo_mime == "application/pdf":
        # Estrategia para PDFs
        texto = await self.gemini_adapter.extraer_texto_pdf(contenido)
    
    elif tipo_mime.startswith("audio/"):
        # Estrategia para audio
        texto = await self.gemini_adapter.extraer_texto_audio(contenido)
```

**Beneficios:**
- Procesamiento apropiado por tipo
- Facil agregar nuevos tipos
- Codigo organizado

---

## Flujo de Datos Completo

### Ejemplo: Crear una cita

```
1. Usuario envia:
   POST /api/chat
   {
     "message": "Necesito agendar una cita para mañana a las 10am"
   }

2. Chat Controller recibe → delega a Orquestador

3. Orquestador:
   - Carga definiciones de herramientas
   - Envia a Gemini:
     * Mensaje: "Necesito agendar..."
     * Contexto: historial previo (si existe)
     * Herramientas: [crear_cita, ver_horarios, ...]

4. Gemini responde:
   {
     "function_call": {
       "name": "ver_horarios_disponibles",
       "arguments": {
         "negocio_id": "uuid-del-negocio",
         "fecha": "2025-12-28"
       }
     }
   }

5. Orquestador ejecuta herramienta:
   - Llama a ver_horarios_disponibles(...)
   - Herramienta hace HTTP GET al backend
   - Backend retorna: ["09:00", "10:00", "11:00", ...]

6. Orquestador envia resultado a Gemini:
   "Los horarios disponibles son: 09:00, 10:00, 11:00..."

7. Gemini responde con function_call:
   {
     "function_call": {
       "name": "crear_cita",
       "arguments": {
         "cliente_id": "...",
         "negocio_id": "...",
         "fecha": "2025-12-28",
         "hora_inicio": "10:00",
         "hora_fin": "11:00"
       }
     }
   }

8. Orquestador ejecuta crear_cita:
   - Valida parametros
   - Hace HTTP POST al backend
   - Backend crea la cita

9. Orquestador envia resultado a Gemini:
   "Cita creada con ID: uuid-de-la-cita"

10. Gemini genera respuesta natural:
    "He agendado tu cita para mañana 28 de diciembre a las 10:00 AM.
     Tu numero de confirmacion es: uuid-de-la-cita"

11. Orquestador actualiza contexto:
    contexto.append({"role": "user", "content": "Necesito..."})
    contexto.append({"role": "assistant", "content": "He agendado..."})

12. Retorna al usuario:
    {
      "exito": true,
      "respuesta": "He agendado tu cita para...",
      "herramientas_ejecutadas": [
        {"herramienta": "ver_horarios_disponibles", ...},
        {"herramienta": "crear_cita", ...}
      ]
    }
```

---

## Consideraciones de Seguridad

1. **API Keys en variables de entorno** - Nunca en codigo
2. **Validacion de parametros** - Todas las herramientas validan input
3. **Timeouts en llamadas HTTP** - Previene bloqueos
4. **CORS configurado** - Control de acceso
5. **Usuario no-root en Docker** - Menor superficie de ataque
6. **Health checks** - Monitoreo de estado

---

## Escalabilidad

1. **Asyncio** - Todas las operaciones I/O son asincronas
2. **Stateless** - Facil escalar horizontalmente
3. **Singleton con cuidado** - Puede ser problema en multi-instancia
4. **Cache potencial** - Se puede agregar cache de respuestas
5. **Queue de mensajes** - Se puede agregar para alta carga

---

## Mantenibilidad

1. **Separacion de responsabilidades** - Cada modulo tiene funcion clara
2. **Documentacion inline** - Docstrings en todas las funciones
3. **Tipos definidos** - Type hints para mejor IDE support
4. **Patrones consistentes** - Codigo predecible
5. **Configuracion centralizada** - Cambios en un solo lugar

---

Este documento describe la arquitectura completa del microservicio MCP. Para comenzar a usarlo, consulta el [README.md](README.md).
