from typing import Any, Dict, List

from backend.services.retrieval_service import retrieval_service
from backend.services.compliance_service import compliance_service


class ComplianceRetrievalAgent:
    """
    Agent 3 - Compliance & Retrieval Agent

    Responsibilities:
    - Search the maritime knowledge base.
    - Retrieve relevant emergency procedures.
    - Retrieve supporting SOLAS / IMO references.
    - Perform incident-aware knowledge retrieval.
    - Perform prototype preliminary compliance assessments.
    - Provide structured results to API routes and the Coordinator Agent.
    """

    AGENT_NAME = "Compliance & Retrieval Agent"
    AGENT_ID = "agent_3"

    def __init__(self):
        self.retrieval_service = retrieval_service
        self.compliance_service = compliance_service

    # -------------------------------------------------
    # KNOWLEDGE RETRIEVAL
    # -------------------------------------------------

    def search_knowledge(
        self,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant maritime procedures, regulations,
        and supporting documents from the knowledge base.
        """

        query = query.strip()

        if not query:
            return []

        # Keep the result limit within the supported range.
        limit = max(1, min(limit, 10))

        return self.retrieval_service.search(
            query=query,
            limit=limit
        )

    # -------------------------------------------------
    # COMPLIANCE ASSESSMENT
    # -------------------------------------------------

    def assess_incident(
        self,
        incident_description: str,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Perform a prototype preliminary compliance assessment
        for a maritime incident.

        The assessment identifies requirements that appear
        to be mentioned in the incident description and
        requirements that were not detected.
        """

        incident_description = incident_description.strip()

        if not incident_description:
            return self._empty_assessment()

        # Keep the result limit within the supported range.
        limit = max(1, min(limit, 10))

        return self.compliance_service.check_compliance(
            incident_description=incident_description,
            limit=limit
        )

    # -------------------------------------------------
    # EMPTY ASSESSMENT RESPONSE
    # -------------------------------------------------

    def _empty_assessment(
        self
    ) -> Dict[str, Any]:
        """
        Return a safe response when no usable incident
        description is provided.
        """

        return {
            "assessment_type":
                "prototype_preliminary_assessment",

            "status":
                "INSUFFICIENT_INFORMATION",

            "matched_requirements": [],

            "missing_requirements": [],

            "references": [],

            "disclaimer": (
                "This is a prototype preliminary assessment "
                "and not a legal determination of maritime "
                "compliance."
            )
        }

    # -------------------------------------------------
    # AGENT INFORMATION
    # -------------------------------------------------

    def get_agent_info(
        self
    ) -> Dict[str, Any]:
        """
        Return basic information about the agent and
        its supported capabilities.
        """

        return {
            "agent_name": self.AGENT_NAME,
            "agent_id": self.AGENT_ID,
            "status": "active",

            "capabilities": [
                "Maritime knowledge retrieval",
                "Emergency procedure retrieval",
                "SOLAS/IMO reference retrieval",
                "Incident-aware document ranking",
                "Preliminary compliance assessment"
            ]
        }


# -----------------------------------------------------
# SINGLETON AGENT INSTANCE
# -----------------------------------------------------

compliance_retrieval_agent = ComplianceRetrievalAgent()