import hashlib

import secrets

from datetime import datetime, timedelta, timezone

from backend.database.mongodb import db

from backend.utils.security import (

    hash_password,

    verify_password,

    validate_password,

    create_access_token,

)

from backend.services.login_rate_limiter import login_rate_limiter

class AuthService:

    # ==========================================

    # REGISTER USER

    # ==========================================

    def register_user(

        self,

        username: str,

        email: str,

        password: str,

        role: str

    ):

        if db is None:

            raise RuntimeError(

                "Database connection is not available."

            )

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

                "Password must be at least 8 characters long "

                "and include uppercase, lowercase, number "

                "and special character. Maximum 72 UTF-8 bytes."

            )

        # Public registration must not grant elevated roles

        role = "crew"

        user_document = {

            "username": username,

            "email": email,

            "password_hash": hash_password(password),

            "role": role,

            "is_active": True,

            "token_version": 0,

            "created_at": datetime.now(timezone.utc),

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

            "is_active": True,

        }

    # ==========================================

    # LOGIN USER

    # ==========================================

    def authenticate_user(self, username: str, password: str):

        if db is None:

            raise RuntimeError("Database connection is not available.")

        username = username.strip().lower()

        # Check the login attempt window before validating credentials.
        try:
            login_rate_limiter.check_limit(username)
        except ValueError as error:
            if str(error).startswith("Too many failed login attempts"):
                self.create_audit_log(
                    username=username,
                    action="LOGIN_RATE_LIMITED"
                )
            raise

        user = db.users.find_one({"username": username})

        # Use the same public message for unknown users and wrong passwords.

        if not user:

            login_rate_limiter.record_failure(username)

            self.create_audit_log(username=username, action="LOGIN_FAILED")

            raise ValueError("Invalid username or password.")

        if not user.get("is_active", True):

            raise ValueError("User account is disabled.")

        if not verify_password(password, user["password_hash"]):

            login_rate_limiter.record_failure(username)

            self.create_audit_log(username=username, action="LOGIN_FAILED")

            raise ValueError("Invalid username or password.")

        login_rate_limiter.reset_attempts(username)

        token = create_access_token(

            username=user["username"],

            role=user["role"],

            token_version=user.get("token_version", 0),

        )

        self.create_audit_log(username=username, action="LOGIN_SUCCESS")

        return {"access_token": token, "token_type": "bearer"}

    # ==========================================

    # GET USER PROFILE

    # ==========================================

    def get_user(self, username: str):

        if db is None:

            return None

        return db.users.find_one(

            {"username": username.strip().lower()},

            {"password_hash": 0}

        )

    # ==========================================

    # AUDIT LOG

    # ==========================================

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

            "timestamp": datetime.now(timezone.utc),

        })

    # ==========================================

    # FORGOT PASSWORD - REQUEST RESET TOKEN

    # ==========================================

    def request_password_reset(self, email: str):

        """

        Generate a secure, short-lived password reset token.

        Raw token must only be delivered through email.

        Never return the token to the frontend.

        """

        if db is None:

            raise RuntimeError(

                "Database connection is not available."

            )

        email = email.strip().lower()

        user = db.users.find_one({

            "email": email,

            "is_active": True,

        })

        # Do not reveal whether the email is registered

        if not user:

            return None

        raw_token = secrets.token_urlsafe(32)

        token_hash = hashlib.sha256(

            raw_token.encode("utf-8")

        ).hexdigest()

        expires_at = (

            datetime.now(timezone.utc)

            + timedelta(minutes=15)

        )

        # Invalidate previous reset requests

        db.password_resets.delete_many({

            "user_id": user["_id"]

        })

        db.password_resets.insert_one({

            "user_id": user["_id"],

            "token_hash": token_hash,

            "expires_at": expires_at,

            "created_at": datetime.now(timezone.utc),

        })

        # Internal result for email delivery only

        return {

            "email": email,

            "token": raw_token,

        }

    # ==========================================

    # RESET PASSWORD - EMAIL TOKEN

    # ==========================================

    def reset_password(

        self,

        token: str,

        new_password: str

    ):

        if db is None:

            raise RuntimeError(

                "Database connection is not available."

            )

        if not validate_password(new_password):

            raise ValueError(

                "Password does not meet security requirements."

            )

        token_hash = hashlib.sha256(

            token.encode("utf-8")

        ).hexdigest()

        # Consume the token once

        reset_record = db.password_resets.find_one_and_delete({

            "token_hash": token_hash,

            "expires_at": {

                "$gt": datetime.now(timezone.utc)

            },

        })

        if not reset_record:

            raise ValueError(

                "Invalid or expired password reset link."

            )

        new_hash = hash_password(new_password)

        result = db.users.update_one(

            {

                "_id": reset_record["user_id"],

                "is_active": True,

            },

            {

                "$set": {

                    "password_hash": new_hash,

                    "password_changed_at": datetime.now(

                        timezone.utc

                    ),

                },

                "$inc": {

                    "token_version": 1,

                },

            }

        )

        if result.matched_count != 1:

            raise ValueError(

                "Password reset could not be completed."

            )

        # Invalidate remaining reset links

        db.password_resets.delete_many({

            "user_id": reset_record["user_id"]

        })

        user = db.users.find_one({

            "_id": reset_record["user_id"]

        })

        if user:

            self.create_audit_log(

                username=user["username"],

                action="PASSWORD_RESET_SUCCESS"

            )

        return {

            "message": "Password reset successfully."

        }

    # ==========================================

    # CHANGE PASSWORD - LOGGED-IN USER

    # ==========================================

    def change_password(

        self,

        username: str,

        current_password: str,

        new_password: str

    ):

        if db is None:

            raise RuntimeError(

                "Database connection is not available."

            )

        username = username.strip().lower()

        user = db.users.find_one({

            "username": username,

            "is_active": True,

        })

        if not user:

            raise ValueError(

                "User account not found or disabled."

            )

        # 1. Verify current password

        if not verify_password(

            current_password,

            user["password_hash"]

        ):

            self.create_audit_log(

                username=username,

                action="PASSWORD_CHANGE_FAILED"

            )

            raise ValueError(

                "Current password is incorrect."

            )

        # 2. Validate new password

        if not validate_password(new_password):

            raise ValueError(

                "New password does not meet security requirements."

            )

        # 3. Prevent reuse of current password

        if verify_password(

            new_password,

            user["password_hash"]

        ):

            raise ValueError(

                "New password must be different from current password."

            )

        # 4. Hash new password

        new_hash = hash_password(new_password)

        # 5. Update password and revoke existing JWT sessions

        result = db.users.update_one(

            {

                "_id": user["_id"],

                "password_hash": user["password_hash"],

                "is_active": True,

            },

            {

                "$set": {

                    "password_hash": new_hash,

                    "password_changed_at": datetime.now(

                        timezone.utc

                    ),

                },

                "$inc": {

                    "token_version": 1,

                },

            }

        )

        if result.matched_count != 1:

            raise ValueError(

                "Password change could not be completed. "

                "Please try again."

            )

        # 6. Invalidate outstanding password reset links

        db.password_resets.delete_many({

            "user_id": user["_id"]

        })

        # 7. Record audit event

        self.create_audit_log(

            username=username,

            action="PASSWORD_CHANGE_SUCCESS"

        )

        return {

            "message": (

                "Password changed successfully. "

                "Please log in again."

            )

        }

    # ==========================================

    # ADMIN - LIST USERS

    # ==========================================

    def list_users(self):

        if db is None:

            raise RuntimeError(

                "Database connection is not available."

            )

        users = db.users.find(

            {},

            {

                "_id": 0,

                "username": 1,

                "email": 1,

                "role": 1,

                "is_active": 1,

                "created_at": 1,

            }

        ).sort("username", 1)

        return [

            {

                "username": user["username"],

                "email": user["email"],

                "role": user["role"],

                "is_active": user.get("is_active", True),

                "created_at": (

                    user["created_at"].isoformat()

                    if user.get("created_at")

                    else None

                ),

            }

            for user in users

        ]

    # ==========================================

    # ADMIN - UPDATE USER ROLE

    # ==========================================

    def update_user_role(

        self,

        admin_username: str,

        target_username: str,

        new_role: str

    ):

        if db is None:

            raise RuntimeError(

                "Database connection is not available."

            )

        target_username = target_username.strip().lower()

        if new_role not in ("crew", "officer", "admin"):

            raise ValueError("Invalid user role.")

        if admin_username == target_username:

            raise ValueError(

                "You cannot change your own role."

            )

        user = db.users.find_one({

            "username": target_username

        })

        if not user:

            raise ValueError("User not found.")

        result = db.users.update_one(

            {

                "_id": user["_id"],

                "role": user["role"],

            },

            {

                "$set": {"role": new_role},

                "$inc": {"token_version": 1},

            }

        )

        if result.matched_count != 1:

            raise ValueError(

                "User role could not be updated. Please retry."

            )

        self.create_audit_log(

            username=admin_username,

            action=f"ROLE_CHANGED:{target_username}:{new_role}"

        )

        return {

            "message": "User role updated successfully.",

            "username": target_username,

            "role": new_role,

        }

    # ==========================================

    # ADMIN - ACTIVATE / DEACTIVATE USER

    # ==========================================

    def update_user_status(

        self,

        admin_username: str,

        target_username: str,

        is_active: bool

    ):

        if db is None:

            raise RuntimeError(

                "Database connection is not available."

            )

        target_username = target_username.strip().lower()

        if admin_username == target_username:

            raise ValueError(

                "You cannot change your own account status."

            )

        user = db.users.find_one({

            "username": target_username

        })

        if not user:

            raise ValueError("User not found.")

        result = db.users.update_one(

            {

                "_id": user["_id"],

                "is_active": user.get("is_active", True),

            },

            {

                "$set": {"is_active": is_active},

                "$inc": {"token_version": 1},

            }

        )

        if result.matched_count != 1:

            raise ValueError(

                "User status could not be updated. Please retry."

            )

        self.create_audit_log(

            username=admin_username,

            action=(

                f"ACCOUNT_STATUS_CHANGED:"

                f"{target_username}:{is_active}"

            )

        )

        return {

            "message": "User status updated successfully.",

            "username": target_username,

            "is_active": is_active,

        }

    # ==========================================

    # ADMIN - VIEW AUDIT LOGS

    # ==========================================

    def get_audit_logs(self, limit: int = 100):

        if db is None:

            raise RuntimeError(

                "Database connection is not available."

            )

        limit = max(1, min(limit, 200))

        cursor = (

            db.audit_logs

            .find(

                {},

                {

                    "_id": 0,

                    "username": 1,

                    "action": 1,

                    "agent": 1,

                    "timestamp": 1,

                }

            )

            .sort("timestamp", -1)

            .limit(limit)

        )

        logs = list(cursor)

        for log in logs:

            if isinstance(log.get("timestamp"), datetime):

                log["timestamp"] = log["timestamp"].isoformat()

        return logs

auth_service = AuthService()
