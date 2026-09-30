FROM python:3.13.7-slim-bookworm AS dependencies
COPY --from=ghcr.io/astral-sh/uv:0.12.13 /uv /bin/uv
WORKDIR /backend
ENV UV_PROJECT_ENVIRONMENT=/opt/venv UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-install-project --no-dev

FROM python:3.13.7-slim-bookworm AS runtime
ENV PATH="/opt/venv/bin:$PATH" PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /backend
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --no-create-home app
COPY --from=dependencies /opt/venv /opt/venv
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./
COPY --chmod=755 docker-entrypoint.sh ./
USER 10001:10001
HEALTHCHECK --interval=10s --timeout=5s --start-period=180s --retries=6 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:8000' + os.getenv('API_V1_PREFIX', '/api/v1') + '/health', timeout=4)"
EXPOSE 8000
CMD ["./docker-entrypoint.sh"]
