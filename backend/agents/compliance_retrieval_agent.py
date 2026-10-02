from typing import Any, Dict, List

from backend.services.hybrid_retrieval_service import (
    hybrid_retrieval_service
)
from backend.services.compliance_service import (
    compliance_service
)


class ComplianceRetrievalAgent:
    """
    Agent 3 - Compliance & Retrieval Agent

    Responsibilities:
    - Search the maritime knowledge base.
    - Retrieve relevant emergency procedures.
    - Retrieve supporting SOLAS / IMO references.
    - Use hybrid keyword + semantic vector retrieval.
    - Perform incident-aware knowledge retrieval.
    - Perform prototype preliminary compliance assessments.
    - Provide structured results to API routes and
      the Coordinator Agent.
    """

    AGENT_NAME = "Compliance & Retrieval Agent"
    AGENT_ID = "agent_3"

    def __init__(self):

        # Hybrid retrieval combines:
        # 1. Keyword + incident-aware retrieval
        # 2. ChromaDB semantic vector retrieval
        self.retrieval_service = (
            hybrid_retrieval_service
        )

        self.compliance_service = (
            compliance_service
        )

    # -------------------------------------------------
    # KNOWLEDGE RETRIEVAL
    # -------------------------------------------------

    def search_knowledge(
        self,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant maritime procedures,
        regulations, and supporting documents using
        hybrid semantic + incident-aware retrieval.
        """

        query = query.strip()

        if not query:
            return []

        # Keep result limit within supported range.
        limit = max(
            1,
            min(limit, 10)
        )

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
        Perform a prototype preliminary compliance
        assessment for a maritime incident.

        The assessment identifies requirements that
        appear to be mentioned in the incident
        description and requirements that were not
        detected.
        """

        incident_description = (
            incident_description.strip()
        )

        if not incident_description:
            return self._empty_assessment()

        limit = max(
            1,
            min(limit, 10)
        )

        return (
            self.compliance_service.check_compliance(
                incident_description=incident_description,
                limit=limit
            )
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
                "This is a prototype preliminary "
                "assessment and not a legal "
                "determination of maritime compliance."
            )
        }

    # -------------------------------------------------
    # AGENT INFORMATION
    # -------------------------------------------------

    def get_agent_info(
        self
    ) -> Dict[str, Any]:
        """
        Return information about Agent 3 and
        its supported capabilities.
        """

        return {
            "agent_name":
                self.AGENT_NAME,

            "agent_id":
                self.AGENT_ID,

            "status":
                "active",

            "retrieval_mode":
                "hybrid",

            "vector_database":
                "ChromaDB",

            "embedding_model":
                "all-MiniLM-L6-v2",

            "capabilities": [
                "Maritime knowledge retrieval",
                "Emergency procedure retrieval",
                "SOLAS/IMO reference retrieval",
                "Semantic vector retrieval",
                "Keyword-based retrieval",
                "Hybrid retrieval and re-ranking",
                "Incident-aware document ranking",
                "Preliminary compliance assessment"
            ]
        }


# -----------------------------------------------------
# SINGLETON AGENT INSTANCE
# -----------------------------------------------------

compliance_retrieval_agent = (
    ComplianceRetrievalAgent()
)