
import os
import re
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from passlib.context import CryptContext


# ==========================================
# ENVIRONMENT CONFIGURATION
# ==========================================

load_dotenv()


# ==========================================
# PASSWORD HASHING CONFIGURATION
# ==========================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ==========================================
# JWT CONFIGURATION
# ==========================================

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is missing. Add it to the .env file."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ==========================================
# PASSWORD VALIDATION
# ==========================================

def validate_password(password: str) -> bool:
    """
    Validate password strength.

    Requirements:
    - 8 to 72 UTF-8 bytes (bcrypt compatibility)
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    - No leading or trailing spaces
    """

    if not isinstance(password, str):
        return False

    if not 8 <= len(password.encode("utf-8")) <= 72:
        return False

    if not re.search(r"[A-Z]", password):
        return False

    if not re.search(r"[a-z]", password):
        return False

    if not re.search(r"[0-9]", password):
        return False

    if not re.search(r"[^A-Za-z0-9]", password):
        return False

    if password != password.strip():
        return False

    return True


# ==========================================
# PASSWORD HASHING
# ==========================================

def hash_password(password: str) -> str:
    """
    Hash a validated password using bcrypt.
    """

    if not validate_password(password):
        raise ValueError(
            "Password must be 8-72 UTF-8 bytes long and "
            "contain uppercase, lowercase, number, "
            "and special character, without leading "
            "or trailing spaces."
        )

    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verify a password against its stored hash.
    """

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# ==========================================
# JWT TOKEN CREATION
# ==========================================

def create_access_token(
    username: str,
    role: str,
    token_version: int = 0
) -> str:
    """Create a versioned JWT access token."""

    now = datetime.now(timezone.utc)

    expire = now + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": username,
        "role": role,
        "token_version": token_version,
        "iat": now,
        "exp": expire,
        "type": "access"
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

# ==========================================
# JWT TOKEN VERIFICATION
# ==========================================

def decode_access_token(token: str) -> dict:
    """
    Decode and validate an access token.
    """

    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        options={
            "require": ["sub", "iat", "exp", "type"]
        }
    )

    if payload.get("type") != "access":
        raise jwt.InvalidTokenError(
            "Invalid token type."
        )

    return payload
