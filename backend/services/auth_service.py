from datetime import datetime, timezone

from backend.database.mongodb import db
from backend.utils.security import (
    hash_password,
    verify_password,
    validate_password,
    create_access_token
)


class AuthService:

    def register_user(
        self,
        username: str,
        email: str,
        password: str,
        role: str
    ):
        if db is None:
            raise RuntimeError("Database connection is not available.")

        username = username.strip().lower()
        email = email.strip().lower()

        # Check duplicate username
        existing_username = db.users.find_one({
            "username": username
        })

        if existing_username:
            raise ValueError("Username already exists.")

        # Check duplicate email
        existing_email = db.users.find_one({
            "email": email
        })

        if existing_email:
            raise ValueError("Email already exists.")

        # Validate password strength
        if not validate_password(password):
            raise ValueError(
                "Password must contain at least 8 characters, "
                "one uppercase letter, one lowercase letter "
                "and one number."
            )

        user_document = {
            "username": username,
            "email": email,
            "password_hash": hash_password(password),
            "role": role,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }

        db.users.insert_one(user_document)

        self.create_audit_log(
            username=username,
            action="USER_REGISTERED"
        )

        return {
            "username": username,
            "email": email,
            "role": role,
            "is_active": True
        }


    def authenticate_user(
        self,
        username: str,
        password: str
    ):
        if db is None:
            raise RuntimeError("Database connection is not available.")

        username = username.strip().lower()

        user = db.users.find_one({
            "username": username
        })

        if not user:
            self.create_audit_log(
                username=username,
                action="LOGIN_FAILED"
            )
            raise ValueError("Invalid username or password.")

        if not user.get("is_active", True):
            raise ValueError("User account is disabled.")

        if not verify_password(
            password,
            user["password_hash"]
        ):
            self.create_audit_log(
                username=username,
                action="LOGIN_FAILED"
            )
            raise ValueError("Invalid username or password.")

        token = create_access_token(
            username=user["username"],
            role=user["role"]
        )

        self.create_audit_log(
            username=username,
            action="LOGIN_SUCCESS"
        )

        return {
            "access_token": token,
            "token_type": "bearer"
        }


    def get_user(self, username: str):
        if db is None:
            return None

        return db.users.find_one(
            {"username": username},
            {"password_hash": 0}
        )


    def create_audit_log(
        self,
        username: str,
        action: str
    ):
        if db is None:
            return

        db.audit_logs.insert_one({
            "agent": "Security & Access Agent",
            "username": username,
            "action": action,
            "timestamp": datetime.now(timezone.utc)
        })


auth_service = AuthService()