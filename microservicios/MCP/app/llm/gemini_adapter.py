from app.llm.base_adaptador import LLMAdapter

class GeminiAdapter(LLMAdapter):
    
    async def chat(self, mensaje: str, herramienta):
        # Implementación específica para Gemini
        return {"respuesta": "Esta es una respuesta simulada de Gemini."}