import os
import re
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from passlib.context import CryptContext


load_dotenv()


# Password hashing configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is missing. Add it to the .env file."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    """Hash a plain-text password before storing it."""
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """Check whether a plain password matches its hash."""
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def validate_password(password: str) -> bool:
    """Check basic password strength requirements."""

    if len(password) < 8:
        return False

    if not re.search(r"[A-Z]", password):
        return False

    if not re.search(r"[a-z]", password):
        return False

    if not re.search(r"\d", password):
        return False

    return True


def create_access_token(
    username: str,
    role: str
) -> str:
    """Create a JWT access token."""

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": username,
        "role": role,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""

    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )