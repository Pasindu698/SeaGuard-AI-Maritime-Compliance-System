
import unittest

from backend.services.safety_routing_service import (
    safety_routing_service,
)


class TestSafetyRouting(unittest.TestCase):

    def test_01_explicit_fire(self):
        self.assertTrue(
            safety_routing_service.is_safety_related(
                "What is the fire emergency procedure?"
            )
        )

    def test_02_smoke_in_engine_room(self):
        self.assertTrue(
            safety_routing_service.is_safety_related(
                "What should the crew do when smoke "
                "is coming from the engine room?"
            )
        )

    def test_03_vessel_certificate(self):
        self.assertTrue(
            safety_routing_service.is_safety_related(
                "Can this vessel sail without a "
                "valid safety certificate?"
            )
        )

    def test_04_person_falls_into_sea(self):
        self.assertTrue(
            safety_routing_service.is_safety_related(
                "What steps should we take when "
                "someone falls into the sea?"
            )
        )

    def test_05_maritime_operational_question(self):
        self.assertTrue(
            safety_routing_service.is_safety_related(
                "Should the crew report a damaged "
                "navigation system?"
            )
        )

    def test_06_general_greeting(self):
        self.assertFalse(
            safety_routing_service.is_safety_related(
                "Hello, how are you?"
            )
        )

    def test_07_general_concept(self):
        self.assertFalse(
            safety_routing_service.is_safety_related(
                "What is artificial intelligence?"
            )
        )

    def test_08_safety_followup(self):
        history = [
            {
                "role": "user",
                "content": (
                    "What is the fire emergency procedure?"
                ),
            },
            {
                "role": "assistant",
                "content": "Follow vessel procedures.",
            },
        ]

        self.assertTrue(
            safety_routing_service.is_safety_related(
                "What about the crew?",
                history,
            )
        )

    def test_09_oil_spill(self):
        self.assertTrue(
            safety_routing_service.is_safety_related(
                "How should we respond to an oil spill?"
            )
        )

    def test_10_general_maritime_concept(self):
        self.assertFalse(
            safety_routing_service.is_safety_related(
                "What is a ship?"
            )
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
