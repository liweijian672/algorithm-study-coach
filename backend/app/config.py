from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./backend/coach.db"
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""


settings = Settings()

