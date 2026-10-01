from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
    status
)

from backend.models.document import (
    DocumentQueryRequest
)

from backend.agents.document_query_agent import (
    document_query_agent
)


router = APIRouter(
    prefix="/documents",
    tags=["Document & Query Agent"]
)


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED
)
async def upload_document(
    file: UploadFile = File(...)
):

    try:

        return await document_query_agent.process_document(
            file
        )

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


@router.post("/query")
def query_documents(
    request: DocumentQueryRequest
):

    try:

        return document_query_agent.process_query(
            request.query
        )

    except RuntimeError as error:

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error)
        )