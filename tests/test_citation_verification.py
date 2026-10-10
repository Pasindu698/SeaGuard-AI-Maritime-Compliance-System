
import unittest
from unittest.mock import patch, MagicMock

from backend.services.citation_verification_service import (
    citation_verification_service,
)


class TestCitationVerification(unittest.TestCase):

    def test_contradicted_claim(self):

        sources = [
            {
                "citation_id": "SRC-01",
                "filename": "incident_report.txt",
                "source": "test",
                "file_type": "TXT",
                "chunk_id": "1",
                "hybrid_score": 1.0,
                "excerpt": (
                    "The suspected electrical cause "
                    "was preliminary and not confirmed. "
                    "A qualified technical inspection "
                    "was required."
                ),
            }
        ]

        false_answer = (
            "The root cause was officially confirmed, "
            "and no further inspection was required "
            "[SRC-01]."
        )

        mock_response = MagicMock()
        mock_response.text = """
        {
            "overall_status": "unsupported",
            "claims": [
                {
                    "claim": "The root cause was officially confirmed, and no further inspection was required.",
                    "status": "contradicted",
                    "citation_ids": ["SRC-01"],
                    "reason": "The evidence states the cause was not confirmed and inspection was required."
                }
            ]
        }
        """

        with patch.object(
            citation_verification_service.gemini,
            "generate_content",
            return_value=(
                mock_response,
                "test-verification-model",
            ),
        ):
            result = citation_verification_service.verify(
                answer=false_answer,
                sources=sources,
            )

        self.assertEqual(
            result["verification_status"],
            "unsupported",
        )

        self.assertEqual(
            result["verified_claims"][0]["status"],
            "contradicted",
        )

        self.assertEqual(
            result["verification_method"],
            "independent_gemini_review",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
