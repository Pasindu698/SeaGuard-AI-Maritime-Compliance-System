
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

from fastapi.responses import Response
from gridfs import GridFS, NoFile
from bson import ObjectId
from bson.errors import InvalidId

from backend.database.mongodb import db
from backend.services.document_service import document_service


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


# =====================================
# DOCUMENT PDF PREVIEW
# =====================================

@router.get("/{document_id}/preview")
def preview_document(
    document_id: str,
    current_user=Depends(get_current_user),
):
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable.",
        )

    try:
        object_id = ObjectId(document_id)

    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid document ID.",
        )

    # =====================================
    # GET AUTHENTICATED USER ID
    # =====================================

    # UPDATED:
    # Reuse the existing DocumentQueryAgent
    # authentication helper.
    try:
        owner_id = document_query_agent.get_user_id(
            current_user
        )

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Authenticated user ID unavailable.",
        )

    # =====================================
    # VERIFY DOCUMENT OWNERSHIP
    # =====================================

    # Only retrieve documents owned by
    # the authenticated user.
    document = db.documents.find_one({
        "_id": object_id,
        "owner_id": owner_id,
    })

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    # =====================================
    # VALIDATE DOCUMENT TYPE
    # =====================================

    if (
        document.get("document_type", "").upper()
        != "PDF"
    ):
        raise HTTPException(
            status_code=415,
            detail=(
                "PDF preview is only available "
                "for PDF documents."
            ),
        )

    # =====================================
    # GET ORIGINAL PDF FILE ID
    # =====================================

    file_id = document.get("gridfs_file_id")

    if not file_id:
        raise HTTPException(
            status_code=404,
            detail=(
                "Original PDF was not stored. "
                "Please re-upload it."
            ),
        )

    # =====================================
    # RETRIEVE PDF FROM GRIDFS
    # =====================================

    try:
        fs = GridFS(db)

        grid_file = fs.get(file_id)

        # Verify stored file ownership.
        metadata = grid_file.metadata or {}

        if metadata.get("owner_id") != owner_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied.",
            )

        pdf_bytes = grid_file.read()

    except NoFile:
        raise HTTPException(
            status_code=404,
            detail="Stored PDF not found.",
        )

    # =====================================
    # VALIDATE PDF CONTENT
    # =====================================

    # NEW:
    # Ensure stored file has a PDF signature.
    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=422,
            detail="Stored file is not a valid PDF.",
        )

    # =====================================
    # RETURN PDF FOR BROWSER PREVIEW
    # =====================================

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "inline",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "sandbox",
        },
    )


# =====================================
# DOCUMENT METADATA
# =====================================

@router.get("/{document_id}/metadata")
def document_metadata(
    document_id: str,
    current_user=Depends(get_current_user),
):
    # =====================================
    # GET AUTHENTICATED USER ID
    # =====================================

    # UPDATED:
    # Use the same user ID extraction method
    # used by document upload and preview.
    try:
        owner_id = document_query_agent.get_user_id(
            current_user
        )

    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Authenticated user ID unavailable.",
        )

    # =====================================
    # RETRIEVE USER DOCUMENT
    # =====================================

    try:
        document = document_service.get_document_by_id(
            document_id=document_id,
            owner_id=owner_id,
        )

    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Document not found or access denied.",
        )

    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable.",
        )

    # =====================================
    # RETURN DOCUMENT METADATA
    # =====================================

    return {
        "document_id": document["document_id"],
        "filename": document["filename"],
        "document_type": document["document_type"],

        # NEW:
        # Indicates whether an original PDF
        # has a stored GridFS reference.
        "preview_available": document.get(
            "preview_available",
            False
        ),
    }
