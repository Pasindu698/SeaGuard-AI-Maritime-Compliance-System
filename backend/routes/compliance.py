
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
