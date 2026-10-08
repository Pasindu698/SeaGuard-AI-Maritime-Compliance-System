
from typing import List, Optional
from pydantic import BaseModel, Field


# -----------------------------------------
# RETRIEVAL SEARCH
# -----------------------------------------

class RetrievalSearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=2,
        description="Maritime regulation search query"
    )
    limit: int = Field(default=5, ge=1, le=10)


class RetrievalResult(BaseModel):
    filename: str
    source: str
    file_type: str
    chunk_id: int
    keyword_score: int
    similarity_score: float
    detected_incident: Optional[str] = None
    hybrid_score: float
    content: str


class RetrievalSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[RetrievalResult]


# -----------------------------------------
# COMPLIANCE ASSESSMENT
# -----------------------------------------

class ComplianceCheckRequest(BaseModel):
    incident_description: str = Field(
        ...,
        min_length=10,
        description="Maritime incident and response actions"
    )
    limit: int = Field(default=5, ge=1, le=10)


class ComplianceReference(BaseModel):
    filename: str
    source: str
    file_type: str
    chunk_id: int
    keyword_score: int
    similarity_score: float
    hybrid_score: float
    detected_incident: Optional[str] = None


class ComplianceCheckResponse(BaseModel):
    assessment_type: str
    status: str
    matched_requirements: List[str]
    missing_requirements: List[str]
    unverified_requirements: List[str] = Field(
        default_factory=list
    )
    references: List[ComplianceReference]
    disclaimer: str
