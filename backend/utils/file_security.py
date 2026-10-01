from pathlib import Path

from fastapi import UploadFile, HTTPException


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".jpg",
    ".jpeg",
    ".png"
}

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "text/plain",
    "image/jpeg",
    "image/png"
}

MAX_FILE_SIZE = 10 * 1024 * 1024


async def validate_uploaded_file(
    file: UploadFile
):

    filename = file.filename or ""

    extension = Path(filename).suffix.lower()

    # Check file extension
    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF, TXT, JPG, JPEG "
                "and PNG files are allowed."
            )
        )

    # Check MIME type
    if file.content_type not in ALLOWED_CONTENT_TYPES:

        raise HTTPException(
            status_code=400,
            detail="Invalid document type."
        )

    # Read file
    content = await file.read()

    # Check empty file
    if not content:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    # Check file size
    if len(content) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=400,
            detail="File exceeds the 10 MB limit."
        )

    # Validate real PDF signature
    if extension == ".pdf":

        if not content.startswith(b"%PDF"):

            raise HTTPException(
                status_code=400,
                detail="Invalid or corrupted PDF file."
            )

    # Validate JPEG signature
    elif extension in {".jpg", ".jpeg"}:

        if not content.startswith(b"\xff\xd8\xff"):

            raise HTTPException(
                status_code=400,
                detail="Invalid or corrupted JPEG image."
            )

    # Validate PNG signature
    elif extension == ".png":

        if not content.startswith(
            b"\x89PNG\r\n\x1a\n"
        ):

            raise HTTPException(
                status_code=400,
                detail="Invalid or corrupted PNG image."
            )

    # Reset file pointer
    await file.seek(0)

    return True