from typing import List

from pydantic import BaseModel, Field


# -----------------------------------------------------
# RETRIEVAL SEARCH MODELS
# -----------------------------------------------------

class RetrievalSearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=2,
        description=(
            "Maritime compliance or emergency "
            "search query"
        )
    )

    limit: int = Field(
        default=5,
        ge=1,
        le=10,
        description=(
            "Maximum number of retrieval results"
        )
    )


class RetrievalResult(BaseModel):
    """
    Result returned by Agent 3 hybrid retrieval.

    Combines keyword/incident-aware retrieval
    with semantic vector retrieval.
    """

    filename: str
    source: str
    file_type: str
    chunk_id: int

    # Score from the original keyword +
    # incident-aware RetrievalService.
    keyword_score: int

    # Semantic similarity produced by
    # ChromaDB vector retrieval.
    similarity_score: float

    # Incident identified by hybrid retrieval.
    # Can be None for a general query.
    detected_incident: str | None = None

    # Final combined ranking score.
    hybrid_score: float

    content: str


class RetrievalSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[RetrievalResult]


# -----------------------------------------------------
# COMPLIANCE CHECK MODELS
# -----------------------------------------------------

class ComplianceCheckRequest(BaseModel):
    incident_description: str = Field(
        ...,
        min_length=10,
        description=(
            "Description of the maritime incident "
            "and response actions"
        )
    )

    limit: int = Field(
        default=5,
        ge=1,
        le=10,
        description=(
            "Maximum number of knowledge base results"
        )
    )


class ComplianceReference(BaseModel):
    """
    Supporting reference returned by the hybrid
    preliminary compliance assessment service.
    """

    filename: str
    source: str
    file_type: str

    # Original keyword / incident-aware retrieval score
    keyword_score: int

    # Semantic similarity from ChromaDB vector retrieval
    similarity_score: float

    # Final hybrid ranking score
    hybrid_score: float

    # Incident detected by the hybrid retrieval service
    detected_incident: str | None = None


class ComplianceCheckResponse(BaseModel):
    assessment_type: str
    status: str
    matched_requirements: List[str]
    missing_requirements: List[str]
    references: List[ComplianceReference]
    disclaimer: str