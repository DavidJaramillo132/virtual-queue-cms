from fastapi import APIRouter, Form, UploadFile, File
from app.orchestrator.ai_orchestrator import manejar_chat

router = APIRouter()

@router.post("/chat")
async def chat(
    message: str = Form(...),
    file: UploadFile | None = File(None)
):
    response = await manejar_chat(message, file)
    return response
