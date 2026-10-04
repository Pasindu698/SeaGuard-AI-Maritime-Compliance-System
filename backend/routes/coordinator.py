from fastapi import APIRouter, HTTPException

from backend.models.coordinator import (
    CoordinatorRequest,
    CoordinatorResponse
)

from backend.agents.coordinator_agent import (
    coordinator_agent
)


router = APIRouter(
    prefix="/coordinator",
    tags=["Coordinator Agent"]
)


@router.post(
    "/coordinate",
    response_model=CoordinatorResponse
)
def coordinate_incident(
    request: CoordinatorRequest
):

    try:
        incident_description = (
            request.incident_description.strip()
        )

        if not incident_description:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Incident description "
                    "cannot be empty."
                )
            )

        return (
            coordinator_agent.coordinate_incident(
                incident_description=
                    incident_description,
                limit=request.limit
            )
        )

    except HTTPException:
        raise

    except Exception as error:

        print(
            f"Coordinator error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to coordinate "
                "the maritime incident."
            )
        )


@router.get("/info")
def coordinator_info():

    return coordinator_agent.get_agent_info()