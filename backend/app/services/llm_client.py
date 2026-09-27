import httpx

from ..config import settings


class LLMClient:
    def complete(self, prompt: str) -> str:
        raise NotImplementedError


class OpenAICompatibleLLMClient(LLMClient):
    def __init__(
        self,
        base_url: str = settings.llm_base_url,
        api_key: str = settings.llm_api_key,
        model: str = settings.llm_model,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model

    def complete(self, prompt: str) -> str:
        if not self.base_url or not self.api_key or not self.model:
            return "LLM not configured. Set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL."
        response = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=60,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
