import jwt

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer
)

from backend.models.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse
)

from backend.agents.security_access_agent import (
    security_agent
)

from backend.utils.security import (
    decode_access_token
)


router = APIRouter(
    prefix="/auth",
    tags=["Security & Access Agent"]
)

bearer_scheme = HTTPBearer()


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


def require_role(*allowed_roles):

    def role_checker(
        current_user=Depends(get_current_user)
    ):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )

        return current_user

    return role_checker


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
            role=data.role
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error)
        )


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error)
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error)
        )


@router.get(
    "/me",
    response_model=UserResponse
)
def my_profile(
    current_user=Depends(get_current_user)
):
    return current_user


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