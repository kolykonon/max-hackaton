import os
from pathlib import Path
from typing import Self

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # резолвим корень
ENV_FILE = BASE_DIR / ".env"  # путь к env-файлу

_ENV_CONFIG = SettingsConfigDict(
    env_file=str(ENV_FILE),
    extra="ignore",
    case_sensitive=False,
)  # конфиг для pydantic-settings


class SettingsConfigDictMixin:
    """Миксин для того чтобы не писать везде конфиг"""

    model_config = _ENV_CONFIG

    @classmethod
    def from_env(cls) -> Self:  # метод, чтобы классы брали настройки из env-файла
        return cls()


class PostgresSettings(SettingsConfigDictMixin, BaseSettings):
    """Класс настроек для постгреса"""

    model_config = _ENV_CONFIG

    postgres_host: str
    postgres_port: int
    postgres_user: str
    postgres_password: str
    postgres_db: str

    @property
    def postgres_dsn(self) -> str:  # отсюда брать postgres url
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.postgres_user,
                password=self.postgres_password,
                host=self.postgres_host,
                port=self.postgres_port,
                path=self.postgres_db,
            )
        )


class BotSettings(SettingsConfigDictMixin, BaseSettings):
    """Класс настроек макс-бота"""

    model_config = _ENV_CONFIG

    max_bot_token: str
    init_data_ttl: int = 86400

    max_api_base_url: str = "https://platform-api2.max.ru"
    max_bot_username: str = ""
    webapp_url: str = "https://example.ru"

    max_webhook_secret: str = ""
    max_webhook_url: str = ""
    max_mode: str = "polling"

    ssl_certs_dir: Path = Path(os.getenv("SSL_CERTS_DIR", str(BASE_DIR / "certs")))

    @field_validator("ssl_certs_dir", mode="before")
    @classmethod
    def resolve_ssl_certs_dir(cls, value):
        p = Path(value)
        return p if p.is_absolute() else BASE_DIR / p


class DevSettings(SettingsConfigDictMixin, BaseSettings):
    """Класс настроек для разработки"""

    model_config = _ENV_CONFIG

    api_v1_prefix: str = "/api/v1/"
    auth_dev_mode: bool = False
    demo_mode: bool = True

    cors_origins: str = "https://example.ru"
    domain: str = "example.ru"

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            o.strip() for o in self.cors_origins.split(",") if o.strip()
        ]  # разделяем по запятым и убираем пробелы


class Settings(SettingsConfigDictMixin, BaseSettings):
    """Общий класс настроек"""

    model_config = _ENV_CONFIG

    postgres_settings: PostgresSettings = Field(
        default_factory=PostgresSettings.from_env
    )
    bot_settings: BotSettings = Field(default_factory=BotSettings.from_env)
    dev_settings: DevSettings = Field(default_factory=DevSettings.from_env)


settings = Settings()
