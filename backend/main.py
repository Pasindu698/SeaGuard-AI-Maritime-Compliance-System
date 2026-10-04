from fastapi import FastAPI

from backend.database.mongodb import (
    check_database_connection
)

from backend.routes.auth import (
    router as auth_router
)
from backend.routes.documents import (
    router as document_router
)
from backend.routes.compliance import (
    router as compliance_router
)
from backend.routes.coordinator import (
    router as coordinator_router
)

app = FastAPI(
    title="SeaGuard AI API",
    description=(
        "Agentic Maritime Emergency, Security "
        "& Incident Management Assistant"
    ),
    version="1.0.0"
)


app.include_router(auth_router)
app.include_router(document_router)
app.include_router(compliance_router)
app.include_router(coordinator_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to SeaGuard AI",
        "status": "running"
    }


@app.get("/health")
def health():

    connected = check_database_connection()

    return {
        "status": (
            "healthy"
            if connected
            else "degraded"
        ),
        "service": "SeaGuard AI Backend",
        "database": (
            "connected"
            if connected
            else "disconnected"
        )
    }