import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from schema import schema

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

# GraphQL endpoint
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
async def root():
    return {
        "message": "GraphQL API is running",
        "graphql_endpoint": "/graphql",
        "graphql_playground": "/graphql (visit in browser)"
    }

if __name__ == "__main__":
    print("Application is running on: http://localhost:3001")
    print("GraphQL Playground: http://localhost:3001/graphql")
    uvicorn.run(app, host="0.0.0.0", port=3001)
