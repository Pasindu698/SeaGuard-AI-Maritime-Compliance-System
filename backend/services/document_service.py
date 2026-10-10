
from io import BytesIO
from pathlib import Path
from datetime import datetime, timezone

import easyocr
import numpy as np
from PIL import Image

from fastapi import UploadFile
from pypdf import PdfReader
from bson import ObjectId
from bson.errors import InvalidId
from gridfs import GridFS

from backend.database.mongodb import db
from backend.utils.file_security import validate_uploaded_file


class DocumentService:

    def __init__(self):
        # OCR reader for English text in images
        self.ocr_reader = easyocr.Reader(
            ["en"],
            gpu=False
        )

    # =====================================
    # PROCESS UPLOADED DOCUMENT
    # =====================================

    async def process_document(
        self,
        file: UploadFile
    ):

        # Security Agent file validation
        await validate_uploaded_file(file)

        # Read validated file
        content = await file.read()

        # Get file extension
        extension = Path(
            file.filename or ""
        ).suffix.lower()

        # ---------------------------------
        # PDF Document
        # ---------------------------------
        if extension == ".pdf":

            text = self.extract_pdf_text(
                content
            )

            document_type = "PDF"

        # ---------------------------------
        # TXT Document
        # ---------------------------------
        elif extension == ".txt":

            text = self.extract_txt_text(
                content
            )

            document_type = "TXT"

        # ---------------------------------
        # Image Document
        # ---------------------------------
        elif extension in {
            ".jpg",
            ".jpeg",
            ".png"
        }:

            text = self.extract_image_text(
                content
            )

            document_type = "IMAGE"

        else:

            raise ValueError(
                "Unsupported document type."
            )

        # Create document summary
        summary = self.create_summary(
            text
        )

        # Detect maritime incident type
        incident_type = self.detect_incident_type(
            text
        )

        # Extract vessel name
        vessel_name = self.extract_vessel_name(
            text
        )

        return {
            "text": text,
            "summary": summary,
            "incident_type": incident_type,
            "vessel_name": vessel_name,
            "document_type": document_type
        }

    # =====================================
    # PDF TEXT EXTRACTION
    # =====================================

    def extract_pdf_text(
        self,
        content: bytes
    ) -> str:

        try:

            pdf_stream = BytesIO(
                content
            )

            reader = PdfReader(
                pdf_stream
            )

            extracted_pages = []

            for page in reader.pages:

                page_text = page.extract_text()

                if page_text:

                    extracted_pages.append(
                        page_text
                    )

            text = "\n".join(
                extracted_pages
            ).strip()

            if not text:

                raise ValueError(
                    "No readable text was found "
                    "in the PDF."
                )

            return text

        except ValueError:
            raise

        except Exception:

            raise ValueError(
                "Unable to read the PDF document."
            )

    # =====================================
    # TXT TEXT EXTRACTION
    # =====================================

    def extract_txt_text(
        self,
        content: bytes
    ) -> str:

        try:

            text = content.decode(
                "utf-8"
            ).strip()

        except UnicodeDecodeError:

            raise ValueError(
                "TXT file must use UTF-8 encoding."
            )

        if not text:

            raise ValueError(
                "No readable text was found "
                "in the TXT document."
            )

        return text

    # =====================================
    # IMAGE OCR TEXT EXTRACTION
    # =====================================

    def extract_image_text(
        self,
        content: bytes
    ) -> str:

        try:

            # Open image from uploaded bytes
            image = Image.open(
                BytesIO(content)
            )

            # Convert image to RGB
            image = image.convert(
                "RGB"
            )

            # Convert image for EasyOCR
            image_array = np.array(
                image
            )

            # Extract text using OCR
            results = self.ocr_reader.readtext(
                image_array,
                detail=0
            )

            text = "\n".join(
                results
            ).strip()

            if not text:

                raise ValueError(
                    "No readable text was found "
                    "in the image."
                )

            return text

        except ValueError:
            raise

        except Exception:

            raise ValueError(
                "Unable to read text "
                "from the image."
            )

    # =====================================
    # SUMMARY
    # =====================================

    def create_summary(
        self,
        text: str,
        max_length: int = 700
    ) -> str:

        cleaned_text = " ".join(
            text.split()
        )

        if len(cleaned_text) <= max_length:

            return cleaned_text

        summary = cleaned_text[
            :max_length
        ]

        last_space = summary.rfind(" ")

        if last_space > 0:

            summary = summary[
                :last_space
            ]

        return summary + "..."

    # =====================================
    # INCIDENT TYPE DETECTION
    # =====================================

    def detect_incident_type(
        self,
        text: str
    ) -> str:

        text_lower = text.lower()

        incident_keywords = {

            "fire": [
                "fire",
                "smoke",
                "burning"
            ],

            "collision": [
                "collision",
                "collided",
                "impact"
            ],

            "medical_emergency": [
                "medical emergency",
                "injured",
                "injury",
                "unconscious"
            ],

            "person_overboard": [
                "person overboard",
                "man overboard",
                "crew overboard"
            ],

            "security_incident": [
                "unauthorized access",
                "suspicious activity",
                "security breach",
                "intruder"
            ]
        }

        for (
            incident_type,
            keywords
        ) in incident_keywords.items():

            for keyword in keywords:

                if keyword in text_lower:

                    return incident_type

        return "general"

    # =====================================
    # VESSEL NAME EXTRACTION
    # =====================================

    def extract_vessel_name(
        self,
        text: str
    ):

        lines = text.splitlines()

        labels = [
            "vessel name:",
            "ship name:"
        ]

        for line in lines:

            clean_line = line.strip()

            lower_line = clean_line.lower()

            for label in labels:

                if lower_line.startswith(
                    label
                ):

                    value = clean_line.split(
                        ":",
                        1
                    )[1].strip()

                    if value:

                        return value

        return None

    # =====================================
    # SAVE DOCUMENT TO MONGODB
    # =====================================

    def save_document(
        self,
        filename: str,
        text: str,
        summary: str,
        incident_type: str,
        document_type: str,
        vessel_name=None,
        owner_id=None,
        file_content: bytes | None = None
    ) -> str:

        if db is None:

            raise RuntimeError(
                "Database connection "
                "is not available."
            )
        if not owner_id:
            raise ValueError(
                "Authenticated user ID is required."
            )

        document = {

            "filename": filename,

            "document_type": document_type,

            "extracted_text": text,

            "summary": summary,

            "incident_type": incident_type,

            "vessel_name": vessel_name,

            "uploaded_at": datetime.now(
                timezone.utc
            )
        }

        # Store document ownership when supplied.
        # Upload route must pass the authenticated user ID.
        if owner_id is not None:

            document["owner_id"] = str(
                owner_id
            )

        # Store the original PDF securely in GridFS.
        # Only PDFs need the embedded browser preview.
        if document_type.upper() == "PDF" and file_content:
            fs = GridFS(db)

            file_id = fs.put(
                file_content,
                filename=filename,
                content_type="application/pdf",
                metadata={
                    "owner_id": str(owner_id),
                },
            )

            document["gridfs_file_id"] = file_id

        result = db.documents.insert_one(
            document
        )

        return str(
            result.inserted_id
        )

    # =====================================
    # GET SAVED DOCUMENT BY ID
    # =====================================

    def get_document_by_id(
        self,
        document_id: str,
        owner_id: str
    ) -> dict:

        if db is None:

            raise RuntimeError(
                "Database connection "
                "is not available."
            )

        if not owner_id:

            raise ValueError(
                "Authenticated user ID is required."
            )

        try:

            object_id = ObjectId(
                document_id
            )

        except (InvalidId, TypeError):

            raise ValueError(
                "Invalid document ID."
            )

        # Only return documents owned by the
        # authenticated user.
        document = db.documents.find_one(
            {
                "_id": object_id,
                "owner_id": str(owner_id)
            }
        )

        if document is None:

            raise ValueError(
                "Document not found or access denied."
            )

        return {

            "document_id": str(
                document["_id"]
            ),

            "filename": document.get(
                "filename"
            ),

            "document_type": document.get(
                "document_type"
            ),

            "extracted_text": document.get(
                "extracted_text",
                ""
            ),

            "summary": document.get(
                "summary",
                ""
            ),

            "incident_type": document.get(
                "incident_type",
                "general"
            ),

            "vessel_name": document.get(
                "vessel_name"
            ),

            "uploaded_at": document.get(
                "uploaded_at"
            ),
            "preview_available": (
                document.get("gridfs_file_id") is not None
            )
        }


# Create Document Service instance
document_service = DocumentService()
