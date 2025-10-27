from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
import os
from dotenv import load_dotenv

from app.schema import schema
from app.database.connection import test_connection

load_dotenv()

# Crear aplicación FastAPI
app = FastAPI(
    title="GraphQL Service - Fila Virtual",
    description="Servicio GraphQL para reportes y consultas complejas del sistema de fila virtual",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear router de GraphQL
graphql_app = GraphQLRouter(schema)

# Montar GraphQL en /graphql
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
async def root():
    """
    Endpoint raíz con información del servicio
    """
    environment = os.getenv("ENVIRONMENT", "development")
    port = os.getenv("PORT", "8001")
    
    return {
        "service": "GraphQL Service - Fila Virtual",
        "version": "1.0.0",
        "environment": environment,
        "port": port,
        "graphql_endpoint": "/graphql",
        "health_check": "/health",
        "database": {
            "host": os.getenv("DB_HOST"),
            "database": os.getenv("DB_NAME")
        }
    }

@app.get("/health")
async def health_check():
    """
    Endpoint de health check
    """
    db_status = test_connection()
    
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.on_event("startup")
async def startup_event():
    """
    Evento que se ejecuta al iniciar el servidor
    """
    print(f"[v0] Iniciando GraphQL Service...")
    print(f"[v0] Ambiente: {os.getenv('ENVIRONMENT', 'development')}")
    print(f"[v0] Puerto: {os.getenv('PORT', '8001')}")
    print(f"[v0] Base de datos: {os.getenv('DB_HOST')}")
    
    # Probar conexión a la base de datos
    if test_connection():
        print("[v0] ✓ Conexión a base de datos exitosa")
    else:
        print("[v0] ✗ Error al conectar a la base de datos")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
