#!/bin/sh
set -eu
alembic upgrade head
python -m app.seeds.seed
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
