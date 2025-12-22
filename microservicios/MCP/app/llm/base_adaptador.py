from abc import ABC, abstractmethod

class LLMAdapter(ABC):
    @abstractmethod
    async def chat(self, mensaje: str, herramienta):
        pass