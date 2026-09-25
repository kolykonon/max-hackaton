import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl


class InitDataError(Exception):
    """Исключение для ошибок валидации инит данных"""


def validate_sign(sign: str, check_string: str, bot_token: str, data: dict) -> bool:
    """Создаем подпись и сравниваем с переданной подписью"""

    secret = hmac.new(
        b"WebAppData", bot_token.encode(), hashlib.sha256
    ).digest()  # получаем секрет по ключу и токену
    calculated_sign = hmac.new(
        secret, check_string.encode(), hashlib.sha256
    ).hexdigest()  # вычисляем подпись по секретному ключу и строке
    return hmac.compare_digest(calculated_sign, sign)


def validate_init_data(raw: str, bot_token: str, ttl: int):
    """Метод для валидации инит даты, которую дает макс"""

    parsed_data = dict(
        parse_qsl(raw, keep_blank_values=True)
    )  # парсит строку вида "key1=value1&key2=value2" в словарь
    sign = parsed_data.pop("hash", None)
    if not sign:
        raise InitDataError("Hash not found")  # замапить не забыть на fastapi ошибку
    check_string = "\n".join(
        f"{key}={value}" for key, value in sorted(parsed_data.items())
    )
    if not validate_sign(sign, check_string, bot_token, parsed_data):
        raise InitDataError("Invalid signature")

    if (
        time.time() - int(parsed_data.get("auth_date", 0)) > ttl
    ):  # если время жизни init_data истекло
        raise InitDataError("Token expired")

    parsed_data["user"] = json.loads(parsed_data.get("user", "{}"))
    return parsed_data
