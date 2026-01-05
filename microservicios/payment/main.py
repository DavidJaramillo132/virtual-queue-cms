"""
Microservicio de Pagos - Virtual Queue CMS

Sistema de pagos con abstraccion de pasarela, webhooks B2B y suscripciones premium.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json
import os

from app.config import configuracion
from app.controladores import (
    pagos_router,
    partners_router,
    webhooks_router,
    suscripciones_router,
    cola_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida de la aplicacion.
    """
    # Startup
    print("Iniciando Microservicio de Pagos...")
    
    # Validar configuracion
    try:
        configuracion.validar()
    except ValueError as e:
        print(f"ERROR: Configuracion invalida: {e}")
        raise
    
    print(f"Pasarela activa: {configuracion.PASARELA_ACTIVA}")
    print(f"Precio suscripcion: ${configuracion.PRECIO_SUSCRIPCION_MENSUAL}")
    print(f"Dias de prueba: {configuracion.DIAS_PRUEBA_GRATIS}")
    
    yield
    
    # Shutdown
    print("Cerrando Microservicio de Pagos...")


app = FastAPI(
    title="Virtual Queue CMS - Microservicio de Pagos",
    description="""
    Sistema de pagos con las siguientes funcionalidades:
    
    - **Pagos**: Procesa pagos con multiples pasarelas (Stripe, MercadoPago, Mock)
    - **Partners B2B**: Registro y gestion de partners con webhooks bidireccionales
    - **Webhooks**: Recepcion y normalizacion de webhooks de pasarelas
    - **Suscripciones**: Gestion de suscripciones premium para negocios
    - **Cola Premium**: Sistema de colas con prioridad para usuarios premium
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
# En produccion, especificar origenes permitidos via variable de entorno ALLOWED_ORIGINS
# Formato: "http://localhost:4200,https://tudominio.com"
origins_str = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = origins_str.split(",") if origins_str != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log de requests para debugging."""
    if request.url.path.startswith("/suscripciones"):
        body = await request.body()
        print(f"[DEBUG] {request.method} {request.url.path}")
        print(f"[DEBUG] Headers: {dict(request.headers)}")
        print(f"[DEBUG] Body: {body.decode() if body else 'empty'}")
    response = await call_next(request)
    return response

# Incluir routers
app.include_router(pagos_router)
app.include_router(partners_router)
app.include_router(webhooks_router)
app.include_router(suscripciones_router)
app.include_router(cola_router)


@app.get("/")
async def root():
    """Endpoint raiz con informacion del servicio."""
    return {
        "nombre": "Virtual Queue CMS - Microservicio de Pagos",
        "version": "1.0.0",
        "descripcion": "Sistema de pagos, webhooks B2B y suscripciones premium",
        "endpoints": {
            "pagos": "/pagos",
            "partners": "/partners",
            "webhooks": "/webhooks",
            "suscripciones": "/suscripciones",
            "cola": "/cola",
            "health": "/health",
            "docs": "/docs"
        },
        "configuracion": configuracion.obtener_info()
    }


@app.get("/health")
async def health_check():
    """Endpoint de health check para monitoreo."""
    return {
        "status": "ok",
        "service": "payment-service",
        "version": "1.0.0",
        "pasarela": configuracion.PASARELA_ACTIVA
    }