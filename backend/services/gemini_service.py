
import os
import time
import logging

from dotenv import load_dotenv
from google import genai
from google.genai import types, errors

load_dotenv()

logger = logging.getLogger(__name__)


class GeminiService:

    RETRYABLE_CODES = {
        429, 500, 502, 503, 504
    }

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is missing. "
                "Check your .env file."
            )

        self.client = genai.Client(
            api_key=api_key
        )

        self.model = os.getenv(
            "GEMINI_MODEL",
            "gemini-3.5-flash-lite"
        ).strip()

        self.fallback_model = os.getenv(
            "GEMINI_FALLBACK_MODEL",
            "gemini-2.5-flash-lite"
        ).strip()

        self.max_attempts = 2

    def generate_content(
        self,
        contents,
        config=None,
    ):
        """
        Generate Gemini content with retry
        and automatic model fallback.

        Returns:
            (response, model_used)
        """

        models = [self.model]

        if (
            self.fallback_model
            and self.fallback_model != self.model
        ):
            models.append(
                self.fallback_model
            )

        for model_index, model_name in enumerate(models):

            for attempt in range(self.max_attempts):

                try:
                    logger.info(
                        "Gemini request: model=%s attempt=%s",
                        model_name,
                        attempt + 1,
                    )

                    response = (
                        self.client.models.generate_content(
                            model=model_name,
                            contents=contents,
                            config=config,
                        )
                    )

                    if not response.text:
                        raise RuntimeError(
                            "Gemini returned an empty response."
                        )

                    return response, model_name

                except errors.APIError as exc:

                    code = exc.code

                    logger.warning(
                        "Gemini API error: model=%s "
                        "status=%s attempt=%s",
                        model_name,
                        code,
                        attempt + 1,
                    )

                    if code not in self.RETRYABLE_CODES:
                        # Authentication, invalid requests,
                        # permissions etc. should not trigger
                        # automatic fallback.
                        raise RuntimeError(
                            f"Gemini request failed "
                            f"(HTTP {code})."
                        ) from exc

                    is_last_attempt = (
                        attempt == self.max_attempts - 1
                    )

                    if not is_last_attempt:
                        wait_seconds = 2 ** attempt

                        logger.info(
                            "Retrying Gemini in %s seconds",
                            wait_seconds,
                        )

                        time.sleep(wait_seconds)

                    elif model_index < len(models) - 1:
                        logger.warning(
                            "Switching Gemini model: %s -> %s",
                            model_name,
                            models[model_index + 1],
                        )

                    else:
                        raise RuntimeError(
                            "All configured Gemini models "
                            "are temporarily unavailable."
                        ) from exc

                except RuntimeError:
                    # Empty responses are not necessarily
                    # transient API errors.
                    raise

                except Exception:
                    logger.exception(
                        "Unexpected Gemini client error"
                    )

                    raise RuntimeError(
                        "Unexpected Gemini generation error."
                    )

        raise RuntimeError(
            "Gemini could not complete the request."
        )

    def generate_response(
        self,
        question: str,
    ) -> str:

        if not question or not question.strip():
            raise ValueError(
                "Question cannot be empty."
            )

        config = types.GenerateContentConfig(
            system_instruction=(
                "You are SeaGuard AI, a maritime "
                "safety and compliance assistant. "
                "Provide clear, accurate explanations. "
                "Never invent IMO or SOLAS regulations "
                "or document citations. "
                "Do not claim to have verified "
                "documents unless they were supplied. "
                "For emergencies, prioritize approved "
                "vessel procedures and human escalation. "
                "Do not present AI-generated advice "
                "as verified operational instructions."
            ),
            temperature=0.2,
            max_output_tokens=8192,
        )

        response, model_used = (
            self.generate_content(
                contents=question.strip(),
                config=config,
            )
        )

        logger.info(
            "Gemini response generated using %s",
            model_used,
        )

        return response.text.strip()


gemini_service = GeminiService()
