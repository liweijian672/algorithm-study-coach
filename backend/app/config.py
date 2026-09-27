from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


DB_PATH = Path(__file__).resolve().parents[1] / "coach.db"
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        env_file_encoding="utf-8",
    )

    database_url: str = f"sqlite:///{DB_PATH.as_posix()}"
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""


settings = Settings()

