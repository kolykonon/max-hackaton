#!/usr/bin/env python3
"""Запуск проверенного валидатора DATA-API 1.0 из корня репозитория."""

from pathlib import Path
import runpy

if __name__ == "__main__":
    validator = Path(__file__).resolve().parent / "tools" / "data-api" / "validate_data_api.py"
    runpy.run_path(str(validator), run_name="__main__")
