
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=5000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=3000)
    history: List[ChatMessage] = Field(
        default_factory=list,
        max_length=10
    )
    limit: int = Field(default=5, ge=1, le=10)
    document_id: Optional[str] = None


class ChatSource(BaseModel):
    citation_id: str
    filename: str
    source: str
    file_type: str
    chunk_id: str
    hybrid_score: float
    excerpt: str



class ChatResponse(BaseModel):
    answer: str
    mode: Literal["grounded", "general"]
    model: str
    sources: List[ChatSource]
    disclaimer: Optional[str] = None

    verification_status: Optional[str] = None
    verification_method: Optional[str] = None
    verification_model: Optional[str] = None
    verified_claims: List[dict] = Field(
        default_factory=list
    )
    answer_blocked: bool = False




class CreateConversationRequest(BaseModel):
    title: str = Field(
        default="New Chat",
        min_length=1,
        max_length=100,
    )
    document_id: Optional[str] = None



class RenameConversationRequest(BaseModel):
    title: str = Field(min_length=1, max_length=100)


class SendMessageRequest(BaseModel):
    question: str = Field(min_length=2, max_length=3000)
    limit: int = Field(default=5, ge=1, le=10)
    document_id: Optional[str] = None
