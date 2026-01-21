import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from schema import schema
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Practica 6 GraphQL API",
    description="GraphQL API for managing appointments, services, and businesses",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Context getter para pasar el request a los resolvers
async def get_context(request: Request):
    # Obtener el header Authorization (case-insensitive)
    auth_header = (
        request.headers.get("authorization") or 
        request.headers.get("Authorization") or
        request.headers.get("AUTHORIZATION")
    )
    
    # Log detallado para debugging
    if auth_header:
        logger.info(f"✅ Request CON Authorization: {auth_header[:50]}...")
    else:
        logger.warning("⚠️  Request SIN Authorization header")
        logger.debug(f"Headers recibidos: {dict(request.headers)}")
    
    return {"request": request, "auth_header": auth_header}

# GraphQL endpoint con contexto
graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
async def root():
    return {
        "message": "GraphQL API is running",
        "graphql_endpoint": "/graphql",
        "graphql_playground": "/graphql (visit in browser)"
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "graphql-service",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("Application is running on: http://localhost:3001")
    print("GraphQL Playground: http://localhost:3001/graphql")
    uvicorn.run(app, host="0.0.0.0", port=3001)
