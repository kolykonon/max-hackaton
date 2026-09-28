FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:0.12.13 /uv /uvx /bin/

ENV UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /backend

COPY pyproject.toml uv.lock ./

RUN uv sync --locked --no-install-project --no-dev

COPY . .

# При старте: миграции → сиды (идемпотентные) → uvicorn (ТЗ §9)
CMD ["sh", "-c", "uv run --no-sync alembic upgrade head && uv run --no-sync python -m app.seeds.seed && uv run --no-sync uvicorn app.main:app --host 0.0.0.0 --port 8000"]
