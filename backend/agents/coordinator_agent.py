
from typing import Any, Dict, Optional

from backend.services.coordinator_service import (
    coordinator_service
)


class CoordinatorAgent:
    """
    Agent 4 - Coordinator Agent

    Responsibilities:
    - Coordinate specialized agents.
    - Support document-assisted incident analysis.
    - Classify maritime incident risk.
    - Determine escalation requirements.
    - Produce a final structured response.
    - Maintain coordination history.
    """

    AGENT_NAME = "Coordinator Agent"
    AGENT_ID = "agent_4"

    def __init__(self):
        self.coordinator_service = coordinator_service

    # =====================================
    # COORDINATE INCIDENT
    # =====================================

    def coordinate_incident(
        self,
        incident_description: str,
        limit: int = 5,
        document_id: Optional[str] = None,
        current_user=None
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

        # Keep existing text-only incident
        # coordination working.
        if document_id is None:

            return (
                self.coordinator_service
                .coordinate_incident(
                    incident_description=incident_description,
                    limit=limit
                )
            )

        # Document-assisted coordination.
        # The service will verify document ownership
        # and combine Agent 2 and Agent 3 outputs.
        if current_user is None:
            raise ValueError(
                "Authenticated user is required "
                "for document-assisted coordination."
            )

        return (
            self.coordinator_service
            .coordinate_incident(
                incident_description=incident_description,
                limit=limit,
                document_id=document_id,
                current_user=current_user
            )
        )

    # =====================================
    # AGENT INFORMATION
    # =====================================

    def get_agent_info(self) -> Dict[str, Any]:

        return {
            "agent_name": self.AGENT_NAME,
            "agent_id": self.AGENT_ID,
            "status": "active",
            "capabilities": [
                "Incident coordination",
                "Agent 2 document coordination",
                "Agent 3 compliance coordination",
                "Document-assisted incident analysis",
                "Risk classification",
                "LOW/MEDIUM/HIGH risk assessment",
                "Escalation decision support",
                "Recommended action generation",
                "Final coordinated response",
                "MongoDB coordination history"
            ]
        }


coordinator_agent = CoordinatorAgent()
