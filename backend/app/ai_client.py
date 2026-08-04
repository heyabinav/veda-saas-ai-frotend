
import httpx
from typing import Any, Dict, Optional
from .main import APIManager

class AIClient:
    # Providers and their specific API path/payload structures
    PROVIDERS = {
        "GROQ": {"url": "https://api.groq.com/openai/v1/chat/completions", "model": "llama3-8b-8192"},
        "OPENROUTER": {"url": "https://openrouter.ai/api/v1/chat/completions", "model": "meta-llama/llama-3.1-8b-instruct"},
    }

    @staticmethod
    async def ask_question(service: str, question: str, tier: int = 1) -> Dict[str, Any]:
        provider = AIClient.PROVIDERS.get(service.upper())
        if not provider:
            raise ValueError(f"Service {service} not configured for chat.")

        api_key = APIManager.get_key(service, tier)
        if not api_key:
            raise ValueError(f"API key not found for {service} tier {tier}.")

        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": provider["model"],
                "messages": [{"role": "user", "content": question}]
            }
            
            response = await client.post(provider["url"], json=payload, headers=headers)
            
            if response.status_code != 200:
                try:
                    error_text = response.text
                except UnicodeDecodeError:
                    error_text = response.content.decode("utf-8", errors="replace")
                return {"error": error_text}
            
            return response.json()
