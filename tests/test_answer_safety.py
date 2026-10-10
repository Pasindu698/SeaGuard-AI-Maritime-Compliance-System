
import unittest

from backend.services.answer_safety_service import (
    answer_safety_service,
)


class TestAnswerSafety(unittest.TestCase):

    def setUp(self):
        self.sources = [
            {"citation_id": "SRC-01"}
        ]

    def test_supported_answer_allowed(self):
        result = answer_safety_service.apply({
            "answer": "The incident was HIGH priority [SRC-01].",
            "verification_status": "supported",
            "verified_claims": [
                {
                    "claim": "The incident was HIGH priority",
                    "status": "supported",
                    "citation_ids": ["SRC-01"],
                }
            ],
            "sources": self.sources,
        })

        self.assertFalse(result["answer_blocked"])

    def test_unsupported_answer_blocked(self):
        result = answer_safety_service.apply({
            "answer": "A cyberattack caused the incident.",
            "verification_status": "unsupported",
            "verified_claims": [
                {
                    "claim": "A cyberattack caused the incident",
                    "status": "unsupported",
                    "citation_ids": ["SRC-01"],
                }
            ],
            "sources": self.sources,
        })

        self.assertTrue(result["answer_blocked"])
        self.assertNotIn(
            "A cyberattack caused",
            result["answer"],
        )

    def test_partial_answer_filtered(self):
        result = answer_safety_service.apply({
            "answer": (
                "The incident was HIGH priority. "
                "The captain was dismissed."
            ),
            "verification_status": "partially_supported",
            "verified_claims": [
                {
                    "claim": "The incident was HIGH priority",
                    "status": "supported",
                    "citation_ids": ["SRC-01"],
                },
                {
                    "claim": "The captain was dismissed",
                    "status": "unsupported",
                    "citation_ids": ["SRC-01"],
                },
            ],
            "sources": self.sources,
        })

        self.assertTrue(result["answer_blocked"])
        self.assertIn(
            "HIGH priority",
            result["answer"],
        )
        self.assertNotIn(
            "captain was dismissed",
            result["answer"],
        )

    def test_unverified_answer_blocked(self):
        result = answer_safety_service.apply({
            "answer": "Unverified emergency advice.",
            "verification_status": "unverified",
            "verified_claims": [],
            "sources": self.sources,
        })

        self.assertTrue(result["answer_blocked"])
        self.assertNotIn(
            "Unverified emergency advice",
            result["answer"],
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
