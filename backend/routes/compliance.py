from fastapi import APIRouter, HTTPException

from backend.models.compliance import (
    RetrievalSearchRequest,
    RetrievalSearchResponse,
    ComplianceCheckRequest,
    ComplianceCheckResponse
)

from backend.agents.compliance_retrieval_agent import (
    compliance_retrieval_agent
)


router = APIRouter(
    prefix="/compliance",
    tags=["Compliance & Retrieval Agent"]
)


# -----------------------------------------------------
# KNOWLEDGE BASE SEARCH
# -----------------------------------------------------

@router.post(
    "/search",
    response_model=RetrievalSearchResponse
)
def search_compliance_knowledge(
    request: RetrievalSearchRequest
):
    """
    Search the maritime knowledge base using the
    Compliance & Retrieval Agent.
    """

    try:
        query = request.query.strip()

        if not query:
            raise HTTPException(
                status_code=400,
                detail="Search query cannot be empty."
            )

        results = (
            compliance_retrieval_agent.search_knowledge(
                query=query,
                limit=request.limit
            )
        )

        return {
            "query": query,
            "total_results": len(results),
            "results": results
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            f"Compliance retrieval error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to search the maritime "
                "knowledge base."
            )
        )


# -----------------------------------------------------
# PRELIMINARY COMPLIANCE ASSESSMENT
# -----------------------------------------------------

@router.post(
    "/check",
    response_model=ComplianceCheckResponse
)
def check_incident_compliance(
    request: ComplianceCheckRequest
):
    """
    Perform a prototype preliminary maritime compliance
    assessment using the Compliance & Retrieval Agent.
    """

    try:
        incident_description = (
            request.incident_description.strip()
        )

        if not incident_description:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Incident description cannot be empty."
                )
            )

        result = (
            compliance_retrieval_agent.assess_incident(
                incident_description=incident_description,
                limit=request.limit
            )
        )

        return result

    except HTTPException:
        raise

    except Exception as error:
        print(
            f"Compliance check error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to perform compliance assessment."
            )
        )