from typing import Any, Dict

from backend.services.coordinator_service import (
    coordinator_service
)


class CoordinatorAgent:
    """
    Agent 4 - Coordinator Agent

    Responsibilities:
    - Coordinate outputs from specialized agents.
    - Classify maritime incident risk.
    - Determine escalation requirements.
    - Produce a final structured response.
    - Maintain coordination history.
    """

    AGENT_NAME = "Coordinator Agent"
    AGENT_ID = "agent_4"

    def __init__(self):
        self.coordinator_service = (
            coordinator_service
        )

    def coordinate_incident(
        self,
        incident_description: str,
        limit: int = 5
    ) -> Dict[str, Any]:

        incident_description = (
            incident_description.strip()
        )

        if not incident_description:
            return (
                self.coordinator_service
                ._empty_response()
            )

        limit = max(
            1,
            min(limit, 10)
        )

        return (
            self.coordinator_service
            .coordinate_incident(
                incident_description=
                    incident_description,
                limit=limit
            )
        )

    def get_agent_info(self) -> Dict[str, Any]:

        return {
            "agent_name":
                self.AGENT_NAME,

            "agent_id":
                self.AGENT_ID,

            "status":
                "active",

            "capabilities": [
                "Incident coordination",
                "Agent 3 compliance coordination",
                "Risk classification",
                "LOW/MEDIUM/HIGH risk assessment",
                "Escalation decision support",
                "Recommended action generation",
                "Final coordinated response",
                "MongoDB coordination history"
            ]
        }


coordinator_agent = CoordinatorAgent()