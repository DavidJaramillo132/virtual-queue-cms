from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
import strawberry
from app.schema import schema
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Crear aplicación FastAPI
app = FastAPI(
    title="GraphQL Service - Fila Virtual",
    description="Servicio GraphQL para reportes y consultas complejas",
    version="1.0.0"
)

# Crear router de GraphQL
graphql_app = GraphQLRouter(schema)

# Montar GraphQL en /graphql
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
async def root():
    return {
        "message": "GraphQL Service - Fila Virtual",
        "graphql_endpoint": "/graphql"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)