
"""
SeaGuard AI - Compliance & Retrieval Agent Routes

Features:
- Maritime regulation and emergency procedure search
- Preliminary incident compliance assessment
- JWT authentication
- Role-Based Access Control (RBAC)
- Error handling and request validation

Access Policy:
    Crew    -> Search + Preliminary Assessment
    Officer -> Search + Preliminary Assessment
    Admin   -> Search + Preliminary Assessment

All endpoints require authentication.

IMPORTANT:
Preliminary assessments are not final compliance
decisions and require human verification.
"""

import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from backend.models.compliance import (
    RetrievalSearchRequest,
    RetrievalSearchResponse,
    ComplianceCheckRequest,
    ComplianceCheckResponse,
)

from backend.agents.compliance_retrieval_agent import (
    compliance_retrieval_agent,
)

from backend.routes.auth import (
    require_role,
)

from pathlib import Path
from fastapi.responses import FileResponse

from backend.services.retrieval_service import (
    retrieval_service,
)


# =====================================================
# LOGGER CONFIGURATION
# =====================================================

logger = logging.getLogger(__name__)


# =====================================================
# ROLE PERMISSIONS
# =====================================================

ALLOWED_COMPLIANCE_ROLES = (
    "crew",
    "officer",
    "admin",
)


# =====================================================
# COMPLIANCE ROUTER
# =====================================================

router = APIRouter(
    prefix="/compliance",
    tags=["Compliance & Retrieval Agent"],
)


# =====================================================
# SEARCH MARITIME KNOWLEDGE
# =====================================================

@router.post(
    "/search",
    response_model=RetrievalSearchResponse,
    status_code=status.HTTP_200_OK,
)
def search_compliance_knowledge(
    request: RetrievalSearchRequest,
    current_user=Depends(
        require_role(*ALLOWED_COMPLIANCE_ROLES)
    ),
):
    """
    Search maritime regulations and emergency procedures.

    Allowed roles:
        crew
        officer
        admin

    JWT authentication is required.
    """

    try:
        query = request.query.strip()

        if not query:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Search query cannot be empty.",
            )

        results = (
            compliance_retrieval_agent.search_knowledge(
                query=query,
                limit=request.limit,
            )
        )

        logger.info(
            "Compliance search performed by user=%s, role=%s",
            current_user.get("username"),
            current_user.get("role"),
        )

        return {
            "query": query,
            "total_results": len(results),
            "results": results,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Compliance knowledge retrieval failed."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to search the maritime knowledge base."
            ),
        )


# =====================================================
# PRELIMINARY INCIDENT COMPLIANCE ASSESSMENT
# =====================================================

@router.post(
    "/check",
    response_model=ComplianceCheckResponse,
    status_code=status.HTTP_200_OK,
)
def check_incident_compliance(
    request: ComplianceCheckRequest,
    current_user=Depends(
        require_role(*ALLOWED_COMPLIANCE_ROLES)
    ),
):
    """
    Perform a preliminary maritime compliance assessment.

    Allowed roles:
        crew
        officer
        admin

    JWT authentication is required.

    The result is preliminary and must be reviewed
    by an authorized human officer.
    """

    try:
        description = (
            request.incident_description.strip()
        )

        if not description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incident description cannot be empty.",
            )

        logger.info(
            "Compliance assessment requested by user=%s, role=%s",
            current_user.get("username"),
            current_user.get("role"),
        )

        assessment = (
            compliance_retrieval_agent.assess_incident(
                incident_description=description,
                limit=request.limit,
            )
        )

        logger.info(
            "Compliance assessment completed for user=%s, status=%s",
            current_user.get("username"),
            assessment.get("status"),
        )

        return assessment

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Compliance assessment failed."
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to perform compliance assessment."
            ),
        )

    # =====================================================
# SECURE ORIGINAL DOCUMENT PREVIEW
# =====================================================

@router.get(
    "/documents/{document_path:path}",
    status_code=status.HTTP_200_OK,
)
def preview_knowledge_document(
    document_path: str,
    current_user=Depends(
        require_role(*ALLOWED_COMPLIANCE_ROLES)
    ),
):
    """
    Securely preview original maritime knowledge
    documents stored inside the knowledge_base folder.

    Supported file types:
    - PDF
    - TXT

    Requires JWT authentication and RBAC.
    """

    knowledge_base = (
        retrieval_service.knowledge_base_path.resolve()
    )

    # Normalize Windows paths received from frontend.
    normalized_path = document_path.replace("\\", "/")

    requested_file = (
        knowledge_base / normalized_path
    ).resolve()

    # Prevent path traversal outside knowledge_base.
    if not requested_file.is_relative_to(knowledge_base):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this document is forbidden.",
        )

    if not requested_file.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    allowed_types = {
        ".pdf": "application/pdf",
        ".txt": "text/plain; charset=utf-8",
    }

    extension = requested_file.suffix.lower()

    if extension not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported document type.",
        )

    logger.info(
        "Knowledge document accessed by user=%s, document=%s",
        current_user.get("username"),
        requested_file.name,
    )

    return FileResponse(
        path=str(requested_file),
        media_type=allowed_types[extension],
        filename=requested_file.name,
        content_disposition_type="inline",
        headers={
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )
