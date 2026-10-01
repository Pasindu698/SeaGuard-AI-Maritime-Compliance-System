from fastapi import UploadFile

from backend.services.document_service import document_service
from backend.services.query_service import query_service


class DocumentQueryAgent:

    AGENT_NAME = "Document & Query Agent"

    async def process_document(self, file: UploadFile):

        # Validate PDF and extract information
        processed_data = await document_service.process_document(file)

        # Save processed document in MongoDB
        document_id = document_service.save_document(
            filename=file.filename or "unknown.pdf",
            text=processed_data["text"],
            summary=processed_data["summary"],
            incident_type=processed_data["incident_type"],
            document_type=processed_data["document_type"],
            vessel_name=processed_data["vessel_name"]
        )

        return {
            "document_id": document_id,
            "filename": file.filename or "unknown.pdf",
            "document_type": processed_data["document_type"],
            "text_length": len(processed_data["text"]),
            "summary": processed_data["summary"],
            "incident_type": processed_data["incident_type"],
            "vessel_name": processed_data["vessel_name"]
        }

    def process_query(self, query: str):

        return query_service.answer_query(query)


document_query_agent = DocumentQueryAgent()