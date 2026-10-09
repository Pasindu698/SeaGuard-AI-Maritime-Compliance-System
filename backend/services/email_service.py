
import os
import smtplib
import ssl
from email.message import EmailMessage
from urllib.parse import quote

from dotenv import load_dotenv

load_dotenv()


class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_email = os.getenv("SMTP_EMAIL")
        self.smtp_password = os.getenv("SMTP_APP_PASSWORD")
        self.frontend_url = os.getenv(
            "FRONTEND_URL", "http://localhost:5173"
        ).rstrip("/")

    def send_password_reset_email(self, recipient_email: str, token: str):
        if not self.smtp_email or not self.smtp_password:
            raise RuntimeError(
                "SMTP email configuration is missing."
            )

        reset_link = (
            f"{self.frontend_url}/reset-password"
            f"?token={quote(token, safe='')}"
        )

        message = EmailMessage()
        message["Subject"] = "SeaGuard AI - Reset Your Password"
        message["From"] = self.smtp_email
        message["To"] = recipient_email

        message.set_content(
            f"""Hello,

We received a request to reset your SeaGuard AI password.

Use the following link to reset your password:

{reset_link}

This link expires in 15 minutes and can only be used once.

If you did not request a password reset, you can ignore this email.

SeaGuard AI Security Team
"""
        )

        context = ssl.create_default_context()

        try:
            with smtplib.SMTP(
                self.smtp_host,
                self.smtp_port,
                timeout=20
            ) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(
                    self.smtp_email,
                    self.smtp_password
                )
                server.send_message(message)

        except (smtplib.SMTPException, OSError) as error:
            raise RuntimeError(
                "Unable to send password reset email."
            ) from error

        return True


email_service = EmailService()
