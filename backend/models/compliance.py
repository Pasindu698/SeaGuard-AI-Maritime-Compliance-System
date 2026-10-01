from pydantic import BaseModel, Field
from typing import List


class RetrievalSearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=2,
        description="Maritime compliance or emergency search query"
    )

    limit: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Maximum number of retrieval results"
    )


class RetrievalResult(BaseModel):
    filename: str
    source: str
    file_type: str
    chunk_id: int
    score: int
    content: str


class RetrievalSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[RetrievalResult]

class ComplianceCheckRequest(BaseModel):
    incident_description: str = Field(
        ...,
        min_length=10,
        description="Description of the maritime incident and response actions"
    )
    limit: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Maximum number of knowledge base results"
    )


class ComplianceReference(BaseModel):
    filename: str
    source: str
    file_type: str
    score: int


class ComplianceCheckResponse(BaseModel):
    assessment_type: str
    status: str
    matched_requirements: List[str]
    missing_requirements: List[str]
    references: List[ComplianceReference]
    disclaimer: str