"""
utils/uploads.py — Shared helpers for safely accepting file uploads.

Validates extension, MIME type, size, and writes the payload using a
chunked stream so a single oversized file can't exhaust memory.
"""

import os
import shutil
from typing import Iterable

from fastapi import HTTPException, UploadFile

# 10 MiB — generous for PDFs/DOCX, tiny for DoS attempts
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

ALLOWED_RESUME_EXTS = (".pdf", ".docx")
ALLOWED_RESUME_MIMES = (
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",  # some browsers send this for docx
)


def validate_upload(
    upload: UploadFile,
    allowed_exts: Iterable[str] = ALLOWED_RESUME_EXTS,
    allowed_mimes: Iterable[str] = ALLOWED_RESUME_MIMES,
) -> str:
    """
    Validate an UploadFile's extension and MIME. Returns the lowercase extension.
    Raises HTTPException(422) on rejection.
    """
    ext = os.path.splitext(upload.filename or "")[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_exts)}",
        )
    # Trust MIME only as a soft hint — some clients lie; ext is primary
    if upload.content_type and upload.content_type not in allowed_mimes:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported content-type '{upload.content_type}'.",
        )
    return ext


def save_upload_streaming(
    upload: UploadFile,
    destination_path: str,
    max_bytes: int = MAX_UPLOAD_BYTES,
) -> int:
    """
    Copy the upload to `destination_path` in chunks, aborting if it exceeds
    `max_bytes`. Removes the partial file on failure. Returns bytes written.
    """
    written = 0
    chunk_size = 1024 * 1024  # 1 MiB
    try:
        with open(destination_path, "wb") as out:
            while True:
                chunk = upload.file.read(chunk_size)
                if not chunk:
                    break
                written += len(chunk)
                if written > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Max {max_bytes // (1024*1024)} MiB.",
                    )
                out.write(chunk)
    except HTTPException:
        if os.path.exists(destination_path):
            os.remove(destination_path)
        raise
    finally:
        upload.file.close()
    return written
