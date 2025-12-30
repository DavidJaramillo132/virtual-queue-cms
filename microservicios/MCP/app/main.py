from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.chat_controller import router as chat_router
from app.config import config


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicacion.
    Se ejecuta al iniciar y cerrar el servidor.
    """
    # Startup
    print("Iniciando Microservicio MCP...")
    
    # Validar configuracion
    try:
        config.validate()
        print("Configuracion validada correctamente")
    except ValueError as e:
        print(f"Error en la configuracion: {e}")
    
    print(f"REST API URL: {config.REST_API_URL}")
    print(f"Gemini API configurada: {'Si' if config.GEMINI_API_KEY else 'No'}")
    print(f"OpenAI API configurada: {'Si' if config.OPENAI_API_KEY else 'No'}")
    
    yield
    
    # Shutdown
    print("Cerrando Microservicio MCP...")


app = FastAPI(
    title="Virtual Queue CMS - Microservicio MCP",
    description="Microservicio de Model Context Protocol para asistente de IA con capacidades de gestión de citas",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(chat_router, prefix="/api", tags=["Chat"])


@app.get("/")
def read_root():
    """Endpoint raiz que retorna informacion basica del servicio"""
    return {
        "nombre": "Virtual Queue CMS - Microservicio MCP",
        "version": "1.0.0",
        "descripcion": "Asistente de IA para gestion de citas",
        "endpoints": {
            "chat": "/api/chat",
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


@app.get("/health")
def health():
    """Endpoint de health check para monitoreo"""
    return {
        "status": "ok",
        "service": "mcp-microservice",
        "version": "1.0.0"
    }


@app.get("/api/info")
def info():
    """Informacion sobre las capacidades del servicio"""
    return {
        "capacidades": [
            "Procesamiento de lenguaje natural",
            "Gestion de citas",
            "Consulta de negocios y servicios",
            "Procesamiento de imagenes (OCR)",
            "Extraccion de texto de PDFs",
            "Transcripcion de audio"
        ],
        "herramientas_disponibles": [
            "ver_horarios_disponibles",
            "crear_cita",
            "cancelar_cita",
            "consultar_citas",
            "buscar_negocios",
            "obtener_servicios",
            "obtener_info_negocio"
        ],
        "modelos_soportados": [
            "Gemini 1.5 Flash" if config.GEMINI_API_KEY else None,
            "OpenAI GPT" if config.OPENAI_API_KEY else None
        ]
    }
