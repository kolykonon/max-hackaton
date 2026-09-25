from typing import Annotated

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.postgres_settings.postgres_dsn)

sessionmaker = async_sessionmaker(engine, expire_on_commit=False)


async def get_session():
    async with sessionmaker() as session:
        yield session


SessionDep = Annotated[
    AsyncSession, get_session
]  # прокидывать в функции где нужна бд def foo(session: SessionDep)
