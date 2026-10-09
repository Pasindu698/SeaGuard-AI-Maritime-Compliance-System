import jwt
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from backend.models.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
)
from backend.agents.security_access_agent import security_agent
from backend.utils.security import decode_access_token
from backend.services.auth_service import auth_service
from backend.services.email_service import email_service
# ==========================================
# AUTH ROUTER
# ==========================================
router = APIRouter(
    prefix="/auth",
    tags=["Security & Access Agent"]
)
bearer_scheme = HTTPBearer()
# ==========================================
# GET CURRENT AUTHENTICATED USER
# ==========================================
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    )
):
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        username = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token."
            )
        user = security_agent.get_user_profile(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found."
            )
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled."
            )
        # Reject JWTs issued before a password change/reset
        if payload.get("token_version") != user.get(
            "token_version", 0
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. Please log in again."
            )
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )
# ==========================================
# ROLE-BASED AUTHORIZATION
# ==========================================
def require_role(*allowed_roles):
    def role_checker(
        current_user=Depends(get_current_user)
    ):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to access this resource."
                )
            )
        return current_user
    return role_checker
# ==========================================
# PUBLIC REGISTRATION - CREW ONLY
# ==========================================
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(data: UserRegister):
    try:
        return security_agent.register_user(
            username=data.username,
            email=data.email,
            password=data.password,
            role="crew"
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="Registration service is temporarily unavailable."
        )
# ==========================================
# LOGIN
# ==========================================
@router.post(
    "/login",
    response_model=TokenResponse
)
def login(data: UserLogin):
    try:
        return security_agent.login_user(
            username=data.username,
            password=data.password
        )
    except ValueError as error:
        message = str(error)

        if message.startswith("Too many failed login attempts"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=message,
                headers={"Retry-After": "900"}
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="Login service is temporarily unavailable."
        )
# ==========================================
# CURRENT USER PROFILE
# ==========================================
@router.get(
    "/me",
    response_model=UserResponse
)
def my_profile(
    current_user=Depends(get_current_user)
):
    return current_user
# ==========================================
# OFFICER ACCESS
# ==========================================
@router.get("/officer")
def officer_area(
    current_user=Depends(
        require_role("officer", "admin")
    )
):
    return {
        "message": "Officer access granted.",
        "username": current_user["username"],
        "role": current_user["role"]
    }
# ==========================================
# ADMIN ACCESS
# ==========================================
@router.get("/admin")
def admin_area(
    current_user=Depends(
        require_role("admin")
    )
):
    return {
        "message": "Admin access granted.",
        "username": current_user["username"],
        "role": current_user["role"]
    }
# ==========================================
# FORGOT PASSWORD
# ==========================================
@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    generic_response = {
        "message": (
            "If an active account exists for this email, "
            "a password reset link will be sent."
        )
    }
    try:
        reset_data = auth_service.request_password_reset(
            data.email
        )
        if reset_data:
            email_service.send_password_reset_email(
                recipient_email=reset_data["email"],
                token=reset_data["token"]
            )
        return generic_response
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail=(
                "Password reset service is "
                "temporarily unavailable."
            )
        )
# ==========================================
# RESET PASSWORD
# ==========================================
@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    try:
        return auth_service.reset_password(
            token=data.token,
            new_password=data.new_password
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired reset link, "
                "or invalid password."
            )
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail=(
                "Password reset service is "
                "temporarily unavailable."
            )
        )
# ==========================================
# CHANGE PASSWORD - AUTHENTICATED USERS
# ==========================================
@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_user)
):
    try:
        return security_agent.change_password(
            username=current_user["username"],
            current_password=data.current_password,
            new_password=data.new_password
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail=(
                "Password change service is "
                "temporarily unavailable."
            )
        )
# ==========================================
# ADMIN - LIST ALL USERS
# ==========================================
@router.get("/users")
def list_users(
    current_user=Depends(require_role("admin"))
):
    return auth_service.list_users()
# ==========================================
# ADMIN - UPDATE USER ROLE
# ==========================================
@router.patch("/users/{username}/role")
def update_user_role(
    username: str,
    data: UpdateUserRoleRequest,
    current_user=Depends(require_role("admin"))
):
    try:
        return auth_service.update_user_role(
            admin_username=current_user["username"],
            target_username=username,
            new_role=data.role
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="User management service is unavailable."
        )
# ==========================================
# ADMIN - UPDATE USER STATUS
# ==========================================
@router.patch("/users/{username}/status")
def update_user_status(
    username: str,
    data: UpdateUserStatusRequest,
    current_user=Depends(require_role("admin"))
):
    try:
        return auth_service.update_user_status(
            admin_username=current_user["username"],
            target_username=username,
            is_active=data.is_active
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="User management service is unavailable."
        )
    # ==========================================
# ADMIN - AUDIT LOGS
# ==========================================
@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    current_user=Depends(require_role("admin"))
):
    try:
        return auth_service.get_audit_logs(limit=limit)
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="Audit log service is temporarily unavailable."
        )
