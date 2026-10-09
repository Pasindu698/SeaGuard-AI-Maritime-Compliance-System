
import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator


# ==========================================
# USER ROLES
# ==========================================

UserRole = Literal["crew", "officer", "admin"]


# ==========================================
# USER REGISTRATION MODEL
# ==========================================

class UserRegister(BaseModel):

    username: str = Field(
        min_length=3,
        max_length=50
    )

    email: str = Field(
        min_length=5,
        max_length=100
    )

    password: str = Field(
        min_length=8,
        max_length=128
    )

    role: UserRole = "crew"

    # --------------------------------------
    # USERNAME VALIDATION
    # --------------------------------------

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:

        value = value.strip().lower()

        if not re.fullmatch(
            r"[a-z0-9_]{3,50}",
            value
        ):
            raise ValueError(
                "Username must be 3-50 characters long "
                "and contain only letters, numbers "
                "and underscores."
            )

        return value

    # --------------------------------------
    # EMAIL VALIDATION
    # --------------------------------------

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:

        value = value.strip().lower()

        if not re.fullmatch(
            r"[a-z0-9._%+\-]+@[a-z0-9.-]+\.[a-z]{2,}",
            value
        ):
            raise ValueError(
                "Please enter a valid email address."
            )

        return value

    # --------------------------------------
    # PASSWORD VALIDATION
    # --------------------------------------

    @field_validator("password")
    @classmethod
    def validate_password_strength(
        cls,
        value: str
    ) -> str:

        if len(value) < 8:
            raise ValueError(
                "Password must contain at least 8 characters."
            )

        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "Password must contain at least one uppercase letter."
            )

        if not re.search(r"[a-z]", value):
            raise ValueError(
                "Password must contain at least one lowercase letter."
            )

        if not re.search(r"[0-9]", value):
            raise ValueError(
                "Password must contain at least one number."
            )

        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError(
                "Password must contain at least one special character."
            )

        if value != value.strip():
            raise ValueError(
                "Password cannot start or end with spaces."
            )

        if len(value.encode("utf-8")) > 72:
            raise ValueError(
                "Password must not exceed 72 UTF-8 bytes."
            )

        return value


# ==========================================
# USER LOGIN MODEL
# ==========================================

class UserLogin(BaseModel):

    username: str = Field(
        min_length=1,
        max_length=50
    )

    password: str = Field(
        min_length=1
    )

    @field_validator("username")
    @classmethod
    def normalize_username(
        cls,
        value: str
    ) -> str:

        return value.strip().lower()


# ==========================================
# USER RESPONSE MODEL
# ==========================================

class UserResponse(BaseModel):

    username: str
    email: str
    role: UserRole
    is_active: bool


# ==========================================
# JWT TOKEN RESPONSE MODEL
# ==========================================

class TokenResponse(BaseModel):

    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=5, max_length=100)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()

        if not re.fullmatch(
            r"[a-z0-9._%+\-]+@[a-z0-9.-]+\.[a-z]{2,}",
            value
        ):
            raise ValueError("Please enter a valid email address.")

        return value


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        from backend.utils.security import validate_password

        if not validate_password(value):
            raise ValueError(
                "Password must be 8-72 UTF-8 bytes long and include "
                "uppercase, lowercase, number and special character."
            )

        return value

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        from backend.utils.security import validate_password

        if not validate_password(value):
            raise ValueError(
                "Password must contain uppercase, lowercase, "
                "number and special character, be at least "
                "8 characters long, and not exceed 72 UTF-8 bytes."
            )

        return value


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class UpdateUserStatusRequest(BaseModel):
    is_active: bool