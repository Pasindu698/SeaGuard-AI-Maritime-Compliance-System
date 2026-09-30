from backend.services.auth_service import auth_service


class SecurityAccessAgent:

    AGENT_NAME = "Security & Access Agent"

    def register_user(
        self,
        username: str,
        email: str,
        password: str,
        role: str
    ):
        return auth_service.register_user(
            username=username,
            email=email,
            password=password,
            role=role
        )


    def login_user(
        self,
        username: str,
        password: str
    ):
        return auth_service.authenticate_user(
            username=username,
            password=password
        )


    def get_user_profile(
        self,
        username: str
    ):
        return auth_service.get_user(username)


security_agent = SecurityAccessAgent()