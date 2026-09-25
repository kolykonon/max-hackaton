from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # DB
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "kaplya"
    postgres_user: str = "kaplya"
    postgres_password: str = "change_me"

    # MAX
    max_bot_token: str = ""
    max_api_base_url: str = "https://platform-api2.max.ru"
    max_bot_username: str = ""
    webapp_url: str = "https://example.ru"

    # Webhook
    max_webhook_secret: str = ""
    max_webhook_url: str = ""
    max_mode: str = "webhook"  # "webhook" | "polling"

    # SSL (сертификаты НУЦ Минцифры, через запятую)
    ssl_cert_files: str = ""

    # Auth / demo
    auth_dev_mode: bool = False
    demo_mode: bool = True
    cors_origins: str = "https://example.ru"
    domain: str = "example.ru"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def ssl_cert_files_list(self) -> list[str]:
        return [p.strip() for p in self.ssl_cert_files.split(",") if p.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()