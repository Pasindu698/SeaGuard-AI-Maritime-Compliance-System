
from typing import List, Optional
from pydantic import BaseModel, Field


# =====================================
# COORDINATOR REQUEST
# =====================================

class CoordinatorRequest(BaseModel):

    incident_description: str = Field(
        ...,
        min_length=10,
        max_length=5000
    )

    limit: int = Field(
        default=5,
        ge=1,
        le=10
    )

    # Optional document uploaded through Agent 2
    # Existing text-only requests remain supported.
    document_id: Optional[str] = Field(
        default=None,
        min_length=24,
        max_length=24,
        description=(
            "Optional MongoDB document ID "
            "for document-assisted incident assessment."
        )
    )


# =====================================
# REGULATORY / KNOWLEDGE REFERENCE
# =====================================

class CoordinatorReference(BaseModel):

    filename: str
    source: str
    file_type: str

    detected_incident: Optional[str] = None

    hybrid_score: float


# =====================================
# DOCUMENT ANALYSIS RESULT
# =====================================

class CoordinatorDocument(BaseModel):

    document_id: str

    filename: str

    document_type: Optional[str] = None

    summary: str = ""

    incident_type: str = "general"

    vessel_name: Optional[str] = None


# =====================================
# COORDINATOR RESPONSE
# =====================================

class CoordinatorResponse(BaseModel):

    coordination_id: Optional[str] = None

    # Incident assessment
    incident_type: str
    risk_level: str

    # Human escalation
    escalation_required: bool
    escalation_message: str

    # Recommended actions
    recommended_actions: List[str]

    # Compliance assessment
    compliance_status: str

    matched_requirements: List[str]
    missing_requirements: List[str]

    unverified_requirements: List[str] = Field(
        default_factory=list
    )

    # Maritime knowledge references
    references: List[CoordinatorReference]

    # Optional Agent 2 document result
    document: Optional[CoordinatorDocument] = None

    # Final response
    final_response: str
    disclaimer: str
