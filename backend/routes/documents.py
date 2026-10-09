
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status
)

from backend.models.document import DocumentQueryRequest
from backend.agents.document_query_agent import document_query_agent
from backend.routes.auth import get_current_user


router = APIRouter(
    prefix="/documents",
    tags=["Document & Query Agent"]
)


# =====================================
# DOCUMENT UPLOAD
# =====================================

@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED
)
async def upload_document(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    try:
        # Authentication is checked before processing.
        # Forward the authenticated user to the agent.
        return await document_query_agent.process_document(
            file,
            current_user=current_user
        )

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error)
        )

    except Exception as error:
        print(f"Document upload error: {error}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process the uploaded document."
        )


# =====================================
# DOCUMENT QUERY
# =====================================

@router.post("/query")
def query_documents(
    request: DocumentQueryRequest,
    current_user=Depends(get_current_user)
):
    try:
        # Authentication is checked before querying.
        # The agent must also filter documents by user.
        return document_query_agent.process_query(
            request.query,
            current_user=current_user
        )

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error)
        )

    except Exception as error:
        print(f"Document query error: {error}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process the document query."
        )
