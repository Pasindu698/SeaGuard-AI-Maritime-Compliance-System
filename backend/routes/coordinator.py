
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from backend.models.coordinator import (
    CoordinatorRequest,
    CoordinatorResponse
)

from backend.agents.coordinator_agent import (
    coordinator_agent
)

from backend.routes.auth import (
    get_current_user
)


router = APIRouter(
    prefix="/coordinator",
    tags=["Coordinator Agent"]
)


# ==========================================
# COORDINATE MARITIME INCIDENT
# JWT AUTHENTICATION REQUIRED
# ==========================================

@router.post(
    "/coordinate",
    response_model=CoordinatorResponse
)
def coordinate_incident(
    request: CoordinatorRequest,
    current_user=Depends(get_current_user)
):
    try:

        incident_description = (
            request.incident_description.strip()
        )

        if not incident_description:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Incident description "
                    "cannot be empty."
                )
            )

        # Agent 1: JWT authentication has
        # already been verified by FastAPI.

        # Agent 4: Coordinator receives the
        # incident and optional document ID.

        # Agent 2: Document ownership and
        # extraction data are handled by
        # Coordinator Service when a document
        # is selected.

        # Agent 3: Compliance assessment is
        # performed through Coordinator Service.

        return coordinator_agent.coordinate_incident(
            incident_description=incident_description,
            limit=request.limit,
            document_id=request.document_id,
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

        print(
            f"Coordinator error: {error}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to coordinate "
                "the maritime incident."
            )
        )


# ==========================================
# COORDINATOR AGENT INFORMATION
# JWT AUTHENTICATION REQUIRED
# ==========================================

@router.get("/info")
def coordinator_info(
    current_user=Depends(get_current_user)
):

    return coordinator_agent.get_agent_info()
