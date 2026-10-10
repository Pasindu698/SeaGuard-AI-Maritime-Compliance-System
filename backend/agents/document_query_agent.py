from fastapi import UploadFile

from backend.services.document_service import document_service
from backend.services.query_service import query_service


class DocumentQueryAgent:

    AGENT_NAME = "Document & Query Agent"

    # =====================================
    # GET AUTHENTICATED USER ID
    # =====================================

    @staticmethod
    def get_user_id(current_user):

        if isinstance(current_user, dict):

            user_id = (
                current_user.get("_id")
                or current_user.get("id")
                or current_user.get("user_id")
            )

        else:

            user_id = (
                getattr(current_user, "id", None)
                or getattr(current_user, "_id", None)
                or getattr(current_user, "user_id", None)
            )

        if user_id is None:
            raise ValueError(
                "Authenticated user ID is missing."
            )

        return str(user_id)

    # =====================================
    # PROCESS AND SAVE DOCUMENT
    # =====================================

    async def process_document(
        self,
        file: UploadFile,
        current_user
    ):

        owner_id = self.get_user_id(
            current_user
        )

        # Security Agent validates the uploaded file.
        # Document Service extracts its information.
        processed_data = (
            await document_service.process_document(
                file
            )
        )

        # NEW: Retrieve original PDF bytes for preview.
        # Existing document processing remains unchanged.
        original_pdf = None

        if processed_data["document_type"].upper() == "PDF":

            await file.seek(0)

            original_pdf = await file.read()

            if not original_pdf.startswith(b"%PDF-"):
                raise ValueError(
                    "Invalid PDF file content."
                )

        # Save document with authenticated owner.
        document_id = (
            document_service.save_document(
                filename=file.filename or "unknown",
                text=processed_data["text"],
                summary=processed_data["summary"],
                incident_type=processed_data["incident_type"],
                document_type=processed_data["document_type"],
                vessel_name=processed_data["vessel_name"],
                owner_id=owner_id,

                # NEW: Save original PDF in GridFS.
                file_content=original_pdf
            )
        )

        return {
            "document_id": document_id,
            "filename": file.filename or "unknown",
            "document_type": processed_data["document_type"],
            "text_length": len(
                processed_data["text"]
            ),
            "summary": processed_data["summary"],
            "incident_type": processed_data["incident_type"],
            "vessel_name": processed_data["vessel_name"],

            # NEW: Inform frontend about preview support.
            "preview_available": original_pdf is not None
        }

    # =====================================
    # QUERY SAVED DOCUMENTS
    # =====================================

    def process_query(
        self,
        query: str,
        current_user
    ):

        owner_id = self.get_user_id(
            current_user
        )

        # Query Service must filter its retrieval
        # using this authenticated owner ID.
        return query_service.answer_query(
            query,
            owner_id=owner_id
        )

    # =====================================
    # GET DOCUMENT FOR COORDINATOR
    # =====================================

    def get_document(
        self,
        document_id: str,
        current_user
    ):

        owner_id = self.get_user_id(
            current_user
        )

        return document_service.get_document_by_id(
            document_id=document_id,
            owner_id=owner_id
        )


document_query_agent = DocumentQueryAgent()