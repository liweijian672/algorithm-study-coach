import time

import httpx

from ..config import settings


class LLMClient:
    def complete(self, prompt: str) -> str:
        raise NotImplementedError


class _RetryableError(Exception):
    pass


class OpenAICompatibleLLMClient(LLMClient):
    MAX_RETRIES = 3
    RETRYABLE_STATUS = {429, 500, 502, 503, 504}

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

        last_error: Exception | None = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                response = httpx.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    timeout=60,
                )
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt < self.MAX_RETRIES:
                    time.sleep(2**attempt)
                    continue
                raise RuntimeError(
                    f"LLM request failed after {self.MAX_RETRIES} attempts: {exc}",
                ) from exc

            if response.status_code in self.RETRYABLE_STATUS:
                last_error = _RetryableError(f"status {response.status_code}")
                if attempt < self.MAX_RETRIES:
                    time.sleep(2**attempt)
                    continue
                raise RuntimeError(
                    f"LLM request failed after {self.MAX_RETRIES} attempts: "
                    f"status {response.status_code}",
                )

            response.raise_for_status()
            try:
                content = response.json()["choices"][0]["message"]["content"]
            except (KeyError, IndexError, ValueError) as exc:
                last_error = exc
                if attempt < self.MAX_RETRIES:
                    time.sleep(2**attempt)
                    continue
                raise RuntimeError(
                    f"LLM returned an unexpected payload after "
                    f"{self.MAX_RETRIES} attempts: {exc}",
                ) from exc

            if not content:
                last_error = _RetryableError("empty completion")
                if attempt < self.MAX_RETRIES:
                    time.sleep(2**attempt)
                    continue
                raise RuntimeError(
                    f"LLM returned an empty completion after "
                    f"{self.MAX_RETRIES} attempts",
                )

            return content

        raise RuntimeError(f"LLM request failed: {last_error}")
