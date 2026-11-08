from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, Match, CourtCalibration
from app.schemas.schemas import CourtCalibrationUpdate, CourtCalibrationResponse
from app.services.video_processor import VideoProcessor
from app.services.court_detector import CourtDetector
from app.api.deps import get_current_user

router = APIRouter(prefix="/court", tags=["Court Calibration"])

@router.get("/{match_id}/frame")
def get_calibration_frame(
    match_id: int,
    frame_index: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match or not match.video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match or video not found.")

    _, frame_url = VideoProcessor.extract_key_frame(match.video.file_path, match.id, frame_idx=frame_index)
    return {
        "frame_url": frame_url,
        "width": match.video.metadata_info.width if match.video.metadata_info else 1920,
        "height": match.video.metadata_info.height if match.video.metadata_info else 1080
    }

@router.get("/{match_id}/calibration", response_model=CourtCalibrationResponse)
def get_court_calibration(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    calib = db.query(CourtCalibration).filter(CourtCalibration.match_id == match.id).first()
    if not calib:
        # Generate default calibration
        default_calib = CourtDetector.get_default_corners(confidence=0.5)
        calib = CourtCalibration(
            match_id=match.id,
            is_calibrated=True,
            is_manual_override=False,
            corners=default_calib["corners"],
            court_type=match.match_type.value,
            calibration_confidence=default_calib["confidence"]
        )
        db.add(calib)
        db.commit()
        db.refresh(calib)

    return CourtCalibrationResponse.model_validate(calib)

@router.post("/{match_id}/detect", response_model=CourtCalibrationResponse)
def auto_detect_court(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match or not match.video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match or video not found.")

    frame_path, _ = VideoProcessor.extract_key_frame(match.video.file_path, match.id, frame_idx=25)
    det_result = CourtDetector.detect_court_corners_automatic(frame_path, court_type=match.match_type.value)

    calib = db.query(CourtCalibration).filter(CourtCalibration.match_id == match.id).first()
    if not calib:
        calib = CourtCalibration(match_id=match.id)
        db.add(calib)

    calib.corners = det_result["corners"]
    calib.calibration_confidence = det_result["confidence"]
    calib.is_calibrated = True
    calib.is_manual_override = False
    calib.court_type = match.match_type.value

    # Compute homography
    width = match.video.metadata_info.width if match.video.metadata_info else 1920
    height = match.video.metadata_info.height if match.video.metadata_info else 1080
    H = CourtDetector.calculate_homography(calib.corners, width, height, court_type=calib.court_type)
    if H is not None:
        calib.homography_matrix = H.tolist()

    db.commit()
    db.refresh(calib)
    return CourtCalibrationResponse.model_validate(calib)

@router.put("/{match_id}/calibration", response_model=CourtCalibrationResponse)
def update_court_calibration(
    match_id: int,
    req: CourtCalibrationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    if len(req.corners) != 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exactly 4 corners required (TL, TR, BR, BL).")

    calib = db.query(CourtCalibration).filter(CourtCalibration.match_id == match.id).first()
    if not calib:
        calib = CourtCalibration(match_id=match.id)
        db.add(calib)

    corner_dicts = [{"x": c.x, "y": c.y} for c in req.corners]
    calib.corners = corner_dicts
    calib.court_type = req.court_type
    calib.is_manual_override = True
    calib.is_calibrated = True
    calib.calibration_confidence = 0.98 # User manual verification yields high confidence

    # Recompute homography matrix H
    width = match.video.metadata_info.width if (match.video and match.video.metadata_info) else 1920
    height = match.video.metadata_info.height if (match.video and match.video.metadata_info) else 1080
    H = CourtDetector.calculate_homography(corner_dicts, width, height, court_type=req.court_type)
    if H is not None:
        calib.homography_matrix = H.tolist()

    db.commit()
    db.refresh(calib)
    return CourtCalibrationResponse.model_validate(calib)

