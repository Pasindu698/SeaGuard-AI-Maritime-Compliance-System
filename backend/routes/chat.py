
import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from backend.models.chat import (
    ChatRequest,
    ChatResponse,
    CreateConversationRequest,
    RenameConversationRequest,
    SendMessageRequest,
)

from backend.services.chat_service import (
    chat_service,
)

from backend.services.chat_history_service import (
    chat_history_service,
)

from backend.services.document_chat_service import (
    document_chat_service,
)

from backend.agents.document_query_agent import (
    document_query_agent,
)

from backend.routes.auth import (
    get_current_user,
)


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["AI Chat Assistant"],
    dependencies=[Depends(get_current_user)],
)


# ==========================================
# SHARED HELPERS
# ==========================================

def get_owner_id(current_user):
    """
    Reuse the existing Document Agent's
    authenticated user ID extraction.
    """
    return document_query_agent.get_user_id(
        current_user
    )


def load_owned_document(document_id, current_user):
    """
    Validate that the selected document belongs
    to the authenticated user.
    """
    try:
        return document_query_agent.get_document(
            document_id=document_id,
            current_user=current_user,
        )
    except ValueError:
        # Avoid revealing whether another user's
        # document exists.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )


def generate_chat_response(
    question,
    history,
    limit,
    document_id,
    current_user,
):
    """
    Selected document:
        Use only that document's extracted text.

    No selected document:
        Use the existing Gemini + Hybrid RAG chat.
    """

    if document_id:
        document = load_owned_document(
            document_id=document_id,
            current_user=current_user,
        )

        return document_chat_service.ask(
            question=question,
            history=history,
            document=document,
            limit=limit,
        )

    return chat_service.ask(
        question=question,
        history=history,
        limit=limit,
    )


# ==========================================
# ASK SEAGUARD AI
# JWT AUTHENTICATION REQUIRED
# ==========================================

@router.post(
    "/ask",
    response_model=ChatResponse,
)
def ask_chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
):
    try:
        question = request.question.strip()

        history = [
            item.model_dump()
            for item in request.history
        ]

        # Do not pass unrelated conversation history
        # into a selected-document request.
        if request.document_id:
            history = []

        return generate_chat_response(
            question=question,
            history=history,
            limit=request.limit,
            document_id=request.document_id,
            current_user=current_user,
        )

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except RuntimeError:
        logger.exception("Chat service unavailable")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI assistant is temporarily unavailable.",
        )

    except Exception:
        logger.exception("Unexpected chat error")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process chat request.",
        )


# ==========================================
# CHAT SERVICE INFORMATION
# JWT AUTHENTICATION REQUIRED
# ==========================================

@router.get("/info")
def chat_info():
    return {
        "agent": "SeaGuard AI Chat Assistant",
        "status": "available",
        "features": [
            "Gemini-powered responses",
            "Hybrid maritime retrieval",
            "Selected document chat",
            "Document ownership verification",
            "Document-based source citations",
            "MongoDB conversation history",
            "Follow-up conversation context",
            "JWT authentication",
        ],
    }


# ==========================================
# CREATE CONVERSATION
# ==========================================


@router.post(
    "/conversations",
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    request: CreateConversationRequest,
    current_user=Depends(get_current_user),
):
    owner_id = get_owner_id(current_user)

    try:
        if request.document_id:
            # Validate document ownership before
            # binding it to the conversation.
            load_owned_document(
                document_id=request.document_id,
                current_user=current_user,
            )

        return chat_history_service.create_conversation(
            owner_id=owner_id,
            title=request.title,
            document_id=request.document_id,
        )

    except HTTPException:
        raise

    except RuntimeError:
        logger.exception("Conversation creation failed")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Conversation service is unavailable.",
        )



# ==========================================
# LIST USER CONVERSATIONS
# ==========================================

@router.get("/conversations")
def list_conversations(
    current_user=Depends(get_current_user),
):
    owner_id = get_owner_id(current_user)

    try:
        return chat_history_service.list_conversations(
            owner_id
        )

    except RuntimeError:
        logger.exception("Conversation listing failed")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Conversation service is unavailable.",
        )


# ==========================================
# GET SINGLE CONVERSATION
# ==========================================

@router.get("/conversations/{conversation_id}")
def get_conversation(
    conversation_id: str,
    current_user=Depends(get_current_user),
):
    owner_id = get_owner_id(current_user)

    try:
        return chat_history_service.get_conversation(
            conversation_id,
            owner_id,
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )


# ==========================================
# RENAME CONVERSATION
# ==========================================

@router.patch("/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: str,
    request: RenameConversationRequest,
    current_user=Depends(get_current_user),
):
    owner_id = get_owner_id(current_user)

    try:
        return chat_history_service.rename_conversation(
            conversation_id,
            owner_id,
            request.title,
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )


# ==========================================
# DELETE CONVERSATION
# ==========================================

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user=Depends(get_current_user),
):
    owner_id = get_owner_id(current_user)

    try:
        return chat_history_service.delete_conversation(
            conversation_id,
            owner_id,
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )


# ==========================================
# SEND MESSAGE TO SAVED CONVERSATION
# ==========================================


@router.post(
    "/conversations/{conversation_id}/messages"
)
def send_conversation_message(
    conversation_id: str,
    request: SendMessageRequest,
    current_user=Depends(get_current_user),
):
    owner_id = get_owner_id(current_user)

    try:
        conversation = (
            chat_history_service.get_conversation(
                conversation_id,
                owner_id,
            )
        )

        # The conversation's document binding is
        # authoritative, not the message payload.
        bound_document_id = conversation.get(
            "document_id"
        )

        if request.document_id != bound_document_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Document selection does not match "
                    "this conversation. Create a new "
                    "conversation for another document."
                ),
            )

        previous_messages = [
            {
                "role": message["role"],
                "content": message["content"],
            }
            for message in conversation["messages"][-10:]
        ]

        response = generate_chat_response(
            question=request.question.strip(),
            history=previous_messages,
            limit=request.limit,
            document_id=bound_document_id,
            current_user=current_user,
        )

        updated_conversation = (
            chat_history_service.add_messages(
                conversation_id=conversation_id,
                owner_id=owner_id,
                user_message={
                    "role": "user",
                    "content": request.question.strip(),
                },
                assistant_message={
                    "role": "assistant",
                    "content": response["answer"],
                    "mode": response["mode"],
                    "model": response["model"],
                    "sources": response["sources"],
                    "disclaimer": response["disclaimer"],
                    
                    "verification_status": response.get(
                        "verification_status"
                    ),
                    "verification_method": response.get(
                        "verification_method"
                    ),
                    "verification_model": response.get(
                        "verification_model"
                    ),
                    "verified_claims": response.get(
                        "verified_claims", []
                    ),
                    "answer_blocked": response.get(
                        "answer_blocked",
                        False,
                    ),

                },
            )
        )

        return {
            "response": response,
            "conversation": updated_conversation,
        }

    except HTTPException:
        raise

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    except RuntimeError:
        logger.exception("Conversation message failed")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI assistant is temporarily unavailable.",
        )

    except Exception:
        logger.exception("Unexpected conversation message error")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process conversation message.",
        )

