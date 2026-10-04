from typing import List, Optional
from pydantic import BaseModel, Field


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


class CoordinatorReference(BaseModel):
    filename: str
    source: str
    file_type: str
    detected_incident: Optional[str] = None
    hybrid_score: float


class CoordinatorResponse(BaseModel):
    coordination_id: Optional[str] = None
    incident_type: str
    risk_level: str
    escalation_required: bool
    escalation_message: str

    recommended_actions: List[str]

    compliance_status: str
    matched_requirements: List[str]
    missing_requirements: List[str]

    references: List[CoordinatorReference]

    final_response: str
    disclaimer: str