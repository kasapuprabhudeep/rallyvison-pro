import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Header, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings, VIDEOS_DIR
from app.models.entities import User, Match, UploadedVideo, VideoMetadata, AnalysisStatus
from app.schemas.schemas import VideoResponse
from app.services.video_processor import VideoProcessor
from app.services.security_scanner import SecurityScanner
from app.api.deps import get_current_user, get_user_from_token

router = APIRouter(prefix="/videos", tags=["Videos"])

@router.post("/upload/{match_id}", response_model=VideoResponse)
async def upload_video(
    match_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file_ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Save to disk securely
    safe_filename = f"match_{match.id}_{int(os.path.getmtime('.') if os.path.exists('.') else 0)}_{file.filename}"
    file_path = VIDEOS_DIR / safe_filename

    # Read and enforce file size
    size_bytes = 0
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    with open(file_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024): # 1MB chunks
            size_bytes += len(chunk)
            if size_bytes > max_bytes:
                buffer.close()
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
                )
            buffer.write(chunk)

    # Automated Antivirus & Binary Integrity Verification
    is_clean, scan_reason = SecurityScanner.scan_and_validate_video(file_path)
    if not is_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security Quarantine: {scan_reason}"
        )

    # Ensure video uses web-compatible H.264 codec so it plays in every browser
    file_path = VideoProcessor.ensure_web_compatible(str(file_path))

    # Extract video metadata using OpenCV
    try:
        meta_dict = VideoProcessor.extract_metadata(str(file_path))
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid or corrupted video file: {str(e)}")

    # Generate thumbnail
    thumb_url = VideoProcessor.generate_thumbnail(str(file_path), match.id)

    # Remove existing video if re-uploading
    if match.video:
        if os.path.exists(match.video.file_path):
            try:
                os.remove(match.video.file_path)
            except Exception:
                pass
        db.delete(match.video)
        db.commit()

    uploaded_vid = UploadedVideo(
        match_id=match.id,
        filename=file.filename,
        file_path=str(file_path),
        file_size_bytes=size_bytes,
        mime_type=file.content_type or "video/mp4",
        thumbnail_path=thumb_url
    )
    db.add(uploaded_vid)
    db.commit()
    db.refresh(uploaded_vid)

    meta_obj = VideoMetadata(
        video_id=uploaded_vid.id,
        duration_seconds=meta_dict["duration_seconds"],
        frame_count=meta_dict["frame_count"],
        fps=meta_dict["fps"],
        width=meta_dict["width"],
        height=meta_dict["height"],
        codec=meta_dict["codec"]
    )
    db.add(meta_obj)

    match.status = AnalysisStatus.PENDING
    match.status_message = "Video uploaded. Ready for court calibration or analysis."
    db.commit()
    db.refresh(uploaded_vid)

    return VideoResponse.model_validate(uploaded_vid)

@router.get("/{video_id}", response_model=VideoResponse)
def get_video_info(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    video = db.query(UploadedVideo).join(Match).filter(
        UploadedVideo.id == video_id,
        Match.user_id == current_user.id
    ).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    return VideoResponse.model_validate(video)

@router.get("/{video_id}/stream")
def stream_video(
    video_id: int,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    token_str = token
    if not token_str and authorization and authorization.startswith("Bearer "):
        token_str = authorization.split(" ")[1]

    user = get_user_from_token(token_str, db) if token_str else None

    video = db.query(UploadedVideo).join(Match).filter(UploadedVideo.id == video_id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    is_owner = user is not None and video.match.user_id == user.id
    is_public = bool(video.match.is_public_shared)

    if not is_owner and not is_public:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to stream private video."
        )

    if not os.path.exists(video.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video file not found.")

    return FileResponse(
        video.file_path,
        media_type=video.mime_type,
        filename=video.filename
    )

