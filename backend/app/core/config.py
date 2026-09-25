from pathlib import Path
from typing import Self

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class SettingsConfigDictMixin:
    """Миксин для того чтобы не писать везде конфиг"""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        extra="ignore",
        case_sensitive=False,
    )

    @classmethod
    def from_env(cls) -> Self:  # метод, чтобы классы брали настройки из env-файла
        return cls()


class PostgresSettings(BaseSettings, SettingsConfigDictMixin):
    """Класс настроек для постгреса"""

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
            )
        )


class BotSettings(BaseSettings, SettingsConfigDictMixin):
    """Класс настроек макс-бота"""

    max_bot_token: str
    init_data_ttl: int = 86400

    max_api_base_url: str = "https://platform-api2.max.ru"
    max_bot_username: str = ""
    webapp_url: str = "https://example.ru"

    # Webhook
    max_webhook_secret: str = ""
    max_webhook_url: str = ""
    max_mode: str = "polling"  # "webhook" | "polling"

    # SSL (папка с сертификатами минцифры, относительный путь - от корня репозитория)
    ssl_certs_dir: Path = BASE_DIR / "certs"

    @field_validator("ssl_certs_dir")
    @classmethod
    def resolve_ssl_certs_dir(cls, value: Path) -> Path:
        return value if value.is_absolute() else BASE_DIR / value


class DevSettings(BaseSettings, SettingsConfigDictMixin):
    """Класс настроек для разработки"""

    api_v1_prefix: str = "/api/v1/"
    auth_dev_mode: bool = False
    demo_mode: bool = True

    cors_origins: str = "https://example.ru"
    domain: str = "example.ru"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


class Settings(BaseSettings, SettingsConfigDictMixin):
    """Общий класс настроек,"""

    postgres_settings: PostgresSettings = Field(
        default_factory=PostgresSettings.from_env
    )
    bot_settings: BotSettings = Field(default_factory=BotSettings.from_env)
    dev_settings: DevSettings = Field(default_factory=DevSettings.from_env)


settings = Settings()
