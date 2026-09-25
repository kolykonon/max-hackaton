from typing import Self

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class SettingsConfigDictMixin:
    """Миксин для того чтобы не писать везде конфиг"""

    model_config = SettingsConfigDict(
        env_file="../.env",
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
    init_data_ttl: int


class DevSettings(BaseSettings, SettingsConfigDictMixin):
    """Класс настроек для разработки"""

    auth_dev_mode: bool
    demo_mode: bool


class Settings(BaseSettings, SettingsConfigDictMixin):
    """Общий класс настроек,"""

    postgres_settings: PostgresSettings = Field(
        default_factory=PostgresSettings.from_env
    )
    bot_settings: BotSettings = Field(default_factory=BotSettings.from_env)
    dev_settings: DevSettings = Field(default_factory=DevSettings.from_env)


settings = Settings()
