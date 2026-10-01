from typing import Optional
from pydantic import BaseModel, Field


class DocumentQueryRequest(BaseModel):
    query: str = Field(
        min_length=2,
        max_length=500
    )


class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    document_type: str
    text_length: int
    summary: str
    incident_type: str
    vessel_name: Optional[str] = None


class QueryResponse(BaseModel):
    query: str
    intent: str
    answer: str
    sources: list[str]