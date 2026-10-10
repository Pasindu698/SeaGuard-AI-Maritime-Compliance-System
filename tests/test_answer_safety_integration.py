
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from backend.services.chat_service import ChatService
from backend.services.document_chat_service import (
    DocumentChatService,
)


SOURCE_TEXT = (
    "The incident was classified HIGH priority. "
    "A damaged electrical connection was identified "
    "as a possible contributing factor. "
    "The root cause was not confirmed. "
    "A technical inspection was required."
)

SOURCE = {
    "citation_id": "SRC-01",
    "filename": "incident_report.txt",
    "source": "synthetic_test_document",
    "file_type": "TXT",
    "chunk_id": "1",
    "hybrid_score": 1.0,
    "excerpt": SOURCE_TEXT,
}

RETRIEVAL_RESULT = {
    "filename": "incident_report.txt",
    "source": "synthetic_test_document",
    "file_type": "TXT",
    "chunk_id": "1",
    "hybrid_score": 1.0,
    "content": SOURCE_TEXT,
}

DOCUMENT = {
    "document_id": "synthetic-test-document",
    "filename": "incident_report.txt",
    "document_type": "TXT",
    "extracted_text": SOURCE_TEXT,
}


class TestAnswerSafetyIntegration(unittest.TestCase):

    def setUp(self):
        self.chat = ChatService()
        self.document_chat = DocumentChatService()

    @staticmethod
    def fake_gemini(answer):
        return (
            SimpleNamespace(text=answer),
            "mock-gemini-model",
        )

    @staticmethod
    def fake_verification(answer, status, claims):
        return {
            "answer": answer,
            "verification_status": status,
            "verification_method": "mock_review",
            "verification_model": "mock-verifier",
            "verified_claims": claims,
            "sources": [SOURCE],
        }

    def run_knowledge_chat(
        self,
        generated_answer,
        verification,
    ):
        with (
            patch(
                "backend.services.chat_service."
                "hybrid_retrieval_service.search",
                return_value=[RETRIEVAL_RESULT],
            ),
            patch.object(
                self.chat.gemini,
                "generate_content",
                return_value=self.fake_gemini(
                    generated_answer
                ),
            ),
            patch(
                "backend.services.chat_service."
                "citation_verification_service.verify",
                return_value=verification,
            ),
        ):
            return self.chat.ask(
                question="What is the emergency incident status?",
                history=[],
                limit=5,
            )

    def run_document_chat(
        self,
        generated_answer,
        verification,
    ):
        with (
            patch.object(
                self.document_chat.gemini,
                "generate_content",
                return_value=self.fake_gemini(
                    generated_answer
                ),
            ),
            patch(
                "backend.services.document_chat_service."
                "citation_verification_service.verify",
                return_value=verification,
            ),
        ):
            return self.document_chat.ask(
                question="What was the incident priority?",
                history=[],
                document=DOCUMENT,
                limit=5,
            )

    def test_01_supported_knowledge_answer(self):
        answer = (
            "The incident was HIGH priority [SRC-01]."
        )

        verification = self.fake_verification(
            answer,
            "supported",
            [{
                "claim": "The incident was HIGH priority",
                "status": "supported",
                "citation_ids": ["SRC-01"],
            }],
        )

        result = self.run_knowledge_chat(
            answer,
            verification,
        )

        self.assertEqual(
            result["verification_status"],
            "supported",
        )
        self.assertFalse(result["answer_blocked"])
        self.assertEqual(result["answer"], answer)

    def test_02_unsupported_knowledge_answer(self):
        answer = (
            "A cyberattack caused the incident "
            "[SRC-01]."
        )

        verification = self.fake_verification(
            answer,
            "unsupported",
            [{
                "claim": "A cyberattack caused the incident",
                "status": "unsupported",
                "citation_ids": ["SRC-01"],
            }],
        )

        result = self.run_knowledge_chat(
            answer,
            verification,
        )

        self.assertTrue(result["answer_blocked"])
        self.assertEqual(
            result["verification_status"],
            "unsupported",
        )
        self.assertNotIn(
            "A cyberattack caused",
            result["answer"],
        )

    def test_03_partial_knowledge_answer(self):
        answer = (
            "The incident was HIGH priority [SRC-01]. "
            "The captain was dismissed [SRC-01]."
        )

        verification = self.fake_verification(
            answer,
            "partially_supported",
            [
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
        )

        result = self.run_knowledge_chat(
            answer,
            verification,
        )

        self.assertTrue(result["answer_blocked"])
        self.assertIn(
            "HIGH priority",
            result["answer"],
        )
        self.assertNotIn(
            "captain was dismissed",
            result["answer"].lower(),
        )

    def test_04_unverified_knowledge_answer(self):
        answer = (
            "Unverified emergency instruction "
            "[SRC-01]."
        )

        verification = self.fake_verification(
            answer,
            "unverified",
            [],
        )

        result = self.run_knowledge_chat(
            answer,
            verification,
        )

        self.assertTrue(result["answer_blocked"])
        self.assertNotIn(
            "Unverified emergency instruction",
            result["answer"],
        )

    def test_05_unsupported_document_answer(self):
        answer = (
            "A cyberattack caused the incident "
            "[SRC-01]."
        )

        verification = self.fake_verification(
            answer,
            "unsupported",
            [{
                "claim": "A cyberattack caused the incident",
                "status": "unsupported",
                "citation_ids": ["SRC-01"],
            }],
        )

        result = self.run_document_chat(
            answer,
            verification,
        )

        self.assertTrue(result["answer_blocked"])
        self.assertNotIn(
            "A cyberattack caused",
            result["answer"],
        )

    def test_06_supported_document_answer(self):
        answer = (
            "The incident was HIGH priority [SRC-01]."
        )

        verification = self.fake_verification(
            answer,
            "supported",
            [{
                "claim": "The incident was HIGH priority",
                "status": "supported",
                "citation_ids": ["SRC-01"],
            }],
        )

        result = self.run_document_chat(
            answer,
            verification,
        )

        self.assertFalse(result["answer_blocked"])
        self.assertEqual(result["answer"], answer)

    def test_07_general_chat_not_verified(self):
        answer = "Hello! How can I help you?"

        with (
            patch(
                "backend.services.chat_service."
                "hybrid_retrieval_service.search",
                return_value=[],
            ),
            patch.object(
                self.chat.gemini,
                "generate_content",
                return_value=self.fake_gemini(answer),
            ),
            patch(
                "backend.services.chat_service."
                "citation_verification_service.verify"
            ) as verifier,
        ):
            result = self.chat.ask(
                question="Hello",
                history=[],
                limit=5,
            )

        self.assertEqual(result["mode"], "general")
        self.assertFalse(result["answer_blocked"])
        self.assertIsNone(
            result["verification_status"]
        )
        verifier.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)
