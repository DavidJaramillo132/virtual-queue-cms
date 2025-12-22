from fastapi import FastAPI

app = FastAPI(
    title="Microservicio MCP",
    description="Microservicio para la gestión de MCP",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"AHora si se viene lo chido": "World"}


@app.get("/health")
def health():
    return {"status": "ok"}