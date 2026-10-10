
import json
import unittest

from backend.services.citation_verification_service import (
    citation_verification_service,
)


class TestRealCitationVerification(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # This test uses the real Gemini API.
        cls.verifier = citation_verification_service

        cls.sources = [
            {
                "citation_id": "SRC-01",
                "filename": "incident_report.txt",
                "source": "synthetic_test_document",
                "file_type": "TXT",
                "chunk_id": "1",
                "hybrid_score": 1.0,
                "excerpt": (
                    "MARITIME INCIDENT REPORT. "
                    "A damaged electrical connection near "
                    "the auxiliary generator was identified "
                    "as a possible contributing factor. "
                    "This was a preliminary observation, "
                    "not a confirmed root cause. "
                    "A qualified technical inspection "
                    "was required before the root cause "
                    "could be established. "
                    "The incident was classified HIGH priority."
                ),
            }
        ]

    def verify_answer(self, answer):
        result = self.verifier.verify(
            answer=answer,
            sources=self.sources,
        )

        print("\nVerification result:")
        print(
            json.dumps(
                result,
                indent=2,
                ensure_ascii=False,
            )
        )

        self.assertEqual(
            result["verification_method"],
            "independent_gemini_review",
            "The live Gemini verification call did not complete.",
        )

        self.assertIn(
            result["verification_status"],
            (
                "supported",
                "partially_supported",
                "unsupported",
            ),
        )

        self.assertTrue(
            result["verified_claims"],
            "Gemini did not return claim assessments.",
        )

        return result

    def test_01_supported_claim(self):
        """
        Claim directly supported by the evidence.
        """
        answer = (
            "The suspected electrical cause was "
            "preliminary and required further "
            "technical inspection [SRC-01]."
        )

        result = self.verify_answer(answer)

        self.assertEqual(
            result["verification_status"],
            "supported",
        )

        self.assertTrue(
            all(
                claim["status"] == "supported"
                for claim in result["verified_claims"]
            )
        )

    def test_02_contradicted_claim(self):
        """
        Claim explicitly contradicted by the evidence.
        """
        answer = (
            "The root cause was officially confirmed, "
            "and no further technical inspection "
            "was required [SRC-01]."
        )

        result = self.verify_answer(answer)

        self.assertEqual(
            result["verification_status"],
            "unsupported",
        )

        self.assertTrue(
            any(
                claim["status"] == "contradicted"
                for claim in result["verified_claims"]
            ),
            "Gemini did not identify the contradiction.",
        )

    def test_03_unsupported_claim(self):
        """
        Claim absent from the source evidence.
        """
        answer = (
            "The incident was caused by a cyberattack "
            "on the vessel's navigation system [SRC-01]."
        )

        result = self.verify_answer(answer)

        self.assertEqual(
            result["verification_status"],
            "unsupported",
        )

        self.assertTrue(
            any(
                claim["status"] == "unsupported"
                for claim in result["verified_claims"]
            ),
            "Gemini did not identify the unsupported claim.",
        )

    def test_04_partially_supported_claim(self):
        """
        One supported fact plus one unsupported fact.
        """
        answer = (
            "The incident was classified HIGH priority "
            "[SRC-01]. "
            "The vessel's captain was permanently "
            "removed from duty after the incident "
            "[SRC-01]."
        )

        result = self.verify_answer(answer)

        self.assertEqual(
            result["verification_status"],
            "partially_supported",
        )

        statuses = {
            claim["status"]
            for claim in result["verified_claims"]
        }

        self.assertIn("supported", statuses)
        self.assertIn("unsupported", statuses)


if __name__ == "__main__":
    unittest.main(verbosity=2)
