from pathlib import Path
from fastapi import UploadFile, HTTPException


ALLOWED_EXTENSIONS = {
    ".pdf"
}

ALLOWED_CONTENT_TYPES = {
    "application/pdf"
}

MAX_FILE_SIZE = 10 * 1024 * 1024


async def validate_uploaded_file(
    file: UploadFile
):

    extension = Path(
        file.filename or ""
    ).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail="Only PDF documents are allowed."
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:

        raise HTTPException(
            status_code=400,
            detail="Invalid document type."
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=400,
            detail="File exceeds the 10 MB limit."
        )

    # Basic PDF signature validation
    if not content.startswith(b"%PDF"):

        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted PDF file."
        )

    await file.seek(0)

    return True