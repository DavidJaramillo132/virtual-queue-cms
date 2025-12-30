from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.orchestrator.ai_orchestrator import manejar_chat, obtener_orquestador

router = APIRouter()


class ChatRequest(BaseModel):
    mensaje: str
    usuario_id: Optional[str] = None
    contexto: Optional[dict] = None
    archivo: Optional[dict] = None
    reiniciar_contexto: Optional[bool] = False


@router.post("/chat")
async def chat(request: ChatRequest):
    # Si se solicita reiniciar el contexto, limpiarlo antes de procesar
    if request.reiniciar_contexto:
        orquestador = obtener_orquestador()
        orquestador.limpiar_contexto()
        print("🔄 CONTEXTO REINICIADO")
    
    response = await manejar_chat(
        mensaje=request.mensaje,
        usuario_id=request.usuario_id,
        contexto=request.contexto,
        archivo=request.archivo
    )
    return response


@router.post("/chat/reiniciar")
async def reiniciar_chat():
    """Endpoint para reiniciar el contexto del chat"""
    orquestador = obtener_orquestador()
    orquestador.limpiar_contexto()
    print("🔄 CONTEXTO REINICIADO VÍA ENDPOINT")
    return {
        "exito": True,
        "mensaje": "Contexto reiniciado. Puedes empezar una nueva conversación."
    }
