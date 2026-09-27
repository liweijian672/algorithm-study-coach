from pathlib import Path

from pydantic_settings import BaseSettings


DB_PATH = Path(__file__).resolve().parents[1] / "coach.db"


class Settings(BaseSettings):
    database_url: str = f"sqlite:///{DB_PATH.as_posix()}"
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""


settings = Settings()

