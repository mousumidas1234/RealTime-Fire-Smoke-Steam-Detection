from __future__ import annotations

import hashlib
import hmac
from typing import Any


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


USERS = {
    "admin": {
        "username": "admin",
        "password_hash": hash_password("admin123"),
        "role": "admin",
    },
}


def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    user = USERS.get(username)
    if not user:
        return None
    if not hmac.compare_digest(user["password_hash"], hash_password(password)):
        return None
    return {"username": user["username"], "role": user["role"]}
