
import os
import unittest
from unittest.mock import MagicMock, patch

from google.genai import errors

from backend.services.gemini_service import GeminiService


class TestGeminiFallback(unittest.TestCase):

    def setUp(self):
        # Prevent the test from needing a real API key.
        self.env_patch = patch.dict(
            os.environ,
            {
                "GEMINI_API_KEY": "fake-test-api-key",
                "GEMINI_MODEL": "primary-test-model",
                "GEMINI_FALLBACK_MODEL": "backup-test-model",
            },
        )
        self.env_patch.start()
        self.addCleanup(self.env_patch.stop)

        # Mock the Gemini SDK client.
        self.client_patch = patch(
            "backend.services.gemini_service.genai.Client"
        )
        mock_client_class = self.client_patch.start()
        self.addCleanup(self.client_patch.stop)

        self.mock_client = MagicMock()
        mock_client_class.return_value = self.mock_client

        self.service = GeminiService()

        # Avoid real waiting during retry tests.
        self.sleep_patch = patch(
            "backend.services.gemini_service.time.sleep"
        )
        self.mock_sleep = self.sleep_patch.start()
        self.addCleanup(self.sleep_patch.stop)

    @staticmethod
    def make_api_error(code):
        return errors.APIError(
            code,
            {
                "error": {
                    "code": code,
                    "message": "Simulated API failure",
                    "status": "UNAVAILABLE",
                }
            },
        )

    @staticmethod
    def make_response(text):
        response = MagicMock()
        response.text = text
        return response

    def test_primary_model_success(self):
        """
        Primary succeeds:
        Backup model should not be called.
        """
        self.mock_client.models.generate_content.return_value = (
            self.make_response("Primary model answer")
        )

        response, model_used = self.service.generate_content(
            contents="What is SeaGuard AI?"
        )

        self.assertEqual(
            response.text,
            "Primary model answer",
        )
        self.assertEqual(
            model_used,
            "primary-test-model",
        )
        self.assertEqual(
            self.mock_client.models.generate_content.call_count,
            1,
        )

    def test_primary_503_triggers_fallback(self):
        """
        Primary fails twice with HTTP 503.
        Backup succeeds.
        """
        self.mock_client.models.generate_content.side_effect = [
            self.make_api_error(503),
            self.make_api_error(503),
            self.make_response("Backup model answer"),
        ]

        response, model_used = self.service.generate_content(
            contents="Explain a shipboard fire emergency."
        )

        self.assertEqual(
            response.text,
            "Backup model answer",
        )
        self.assertEqual(
            model_used,
            "backup-test-model",
        )

        calls = (
            self.mock_client.models.generate_content.call_args_list
        )

        self.assertEqual(
            [call.kwargs["model"] for call in calls],
            [
                "primary-test-model",
                "primary-test-model",
                "backup-test-model",
            ],
        )

    def test_429_triggers_fallback(self):
        """
        Rate limiting should trigger retry
        and then fallback.
        """
        self.mock_client.models.generate_content.side_effect = [
            self.make_api_error(429),
            self.make_api_error(429),
            self.make_response("Backup after rate limit"),
        ]

        response, model_used = self.service.generate_content(
            contents="Explain maritime compliance."
        )

        self.assertEqual(
            model_used,
            "backup-test-model",
        )
        self.assertEqual(
            response.text,
            "Backup after rate limit",
        )

    def test_401_does_not_trigger_fallback(self):
        """
        Authentication failures should not
        trigger model fallback.
        """
        self.mock_client.models.generate_content.side_effect = (
            self.make_api_error(401)
        )

        with self.assertRaises(RuntimeError):
            self.service.generate_content(
                contents="Test question"
            )

        self.assertEqual(
            self.mock_client.models.generate_content.call_count,
            1,
        )

    def test_all_models_unavailable(self):
        """
        Both models fail:
        Raise RuntimeError.
        """
        self.mock_client.models.generate_content.side_effect = [
            self.make_api_error(503),
            self.make_api_error(503),
            self.make_api_error(503),
            self.make_api_error(503),
        ]

        with self.assertRaises(RuntimeError) as context:
            self.service.generate_content(
                contents="Test question"
            )

        self.assertIn(
            "All configured Gemini models",
            str(context.exception),
        )

        self.assertEqual(
            self.mock_client.models.generate_content.call_count,
            4,
        )

    def test_empty_response(self):
        """
        Empty Gemini response should be
        rejected.
        """
        self.mock_client.models.generate_content.return_value = (
            self.make_response("")
        )

        with self.assertRaises(RuntimeError):
            self.service.generate_content(
                contents="Test question"
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
