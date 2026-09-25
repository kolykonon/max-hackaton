from typing import Self

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class SettingsConfigMixin:
    model_config = SettingsConfigDict(  # миксин чтобы не дублировать везде конфиг
        env_file="../.env",
        extra="ignore",
        case_sensitive=False,
    )

    @classmethod
    def from_env(cls) -> Self:
        return cls()


class PostgresSettings(BaseSettings, SettingsConfigMixin):
    postgres_host: str
    postgres_port: int
    postgres_user: str
    postgres_password: str
    postgres_db: str

    @property
    def postgres_dsn(self) -> str:
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.postgres_user,
                password=self.postgres_password,
                host=self.postgres_host,
                port=self.postgres_port,
            )
        )


class Settings(BaseSettings):
    postgres_settings: PostgresSettings = Field(
        default_factory=PostgresSettings.from_env
    )


settings = Settings()
