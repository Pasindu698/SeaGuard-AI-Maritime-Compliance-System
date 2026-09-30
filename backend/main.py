from fastapi import FastAPI
from backend.database.mongodb import check_database_connection

app = FastAPI(
    title="SeaGuard AI API",
    description="Agentic Maritime Emergency, Security & Incident Management Assistant",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Welcome to SeaGuard AI",
        "status": "running"
    }

@app.get("/health")
def health_check():
    connected = check_database_connection()

    return {
        "status": "healthy" if connected else "degraded",
        "service": "SeaGuard AI Backend",
        "database": "connected" if connected else "disconnected"
    }