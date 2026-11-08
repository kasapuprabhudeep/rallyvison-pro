from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, Match, AnalysisStatus, ShotEvent, RallyEvent, MovementTrack, ShuttlecockDetection
from app.schemas.schemas import ShotEventResponse, RallyEventResponse, ShotCorrectionRequest
from app.workers.analysis_pipeline import run_match_analysis_pipeline
from app.api.deps import get_current_user

router = APIRouter(prefix="/analysis", tags=["Telemetry Analysis Pipeline"])

@router.post("/{match_id}/start")
def start_analysis(
    match_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")
    
    if not match.video:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload a video before starting analysis.")

    if match.status == AnalysisStatus.PROCESSING:
        return {"message": "Analysis is already in progress.", "progress": match.analysis_progress}

    match.status = AnalysisStatus.PROCESSING
    match.analysis_progress = 2.0
    match.status_message = "Starting telemetry processing pipeline..."
    db.commit()

    background_tasks.add_task(run_match_analysis_pipeline, match.id)

    return {"message": "Analysis started successfully.", "match_id": match.id}

@router.get("/{match_id}/status")
def get_analysis_status(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    return {
        "match_id": match.id,
        "status": match.status,
        "progress": match.analysis_progress,
        "message": match.status_message
    }

@router.get("/{match_id}/results")
def get_analysis_results(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    shots = db.query(ShotEvent).filter(ShotEvent.match_id == match.id).order_by(ShotEvent.timestamp.asc()).all()
    rallies = db.query(RallyEvent).filter(RallyEvent.match_id == match.id).order_by(RallyEvent.rally_number.asc()).all()
    
    # Sample movement tracks for animated playback (e.g. up to 500 points)
    tracks = db.query(MovementTrack).filter(MovementTrack.match_id == match.id).order_by(MovementTrack.timestamp.asc()).all()
    step = max(1, len(tracks) // 400) if tracks else 1
    sampled_tracks = tracks[::step]

    # Sample shuttlecock detections
    shuttle_dets = db.query(ShuttlecockDetection).filter(ShuttlecockDetection.match_id == match.id).order_by(ShuttlecockDetection.timestamp.asc()).all()

    return {
        "match_id": match.id,
        "status": match.status,
        "shots": [ShotEventResponse.model_validate(s) for s in shots],
        "rallies": [RallyEventResponse.model_validate(r) for r in rallies],
        "movement_tracks": [
            {
                "timestamp": t.timestamp,
                "player_id": t.player_id,
                "court_x_m": t.court_x_m,
                "court_y_m": t.court_y_m,
                "speed_kmh": t.instant_speed_kmh,
                "zone": t.court_zone,
                "is_base": t.is_base_position
            } for t in sampled_tracks
        ],
        "shuttlecock_detections": [
            {
                "timestamp": s.timestamp,
                "court_x_m": s.court_x_m,
                "court_y_m": s.court_y_m,
                "speed_kmh": s.estimated_speed_kmh,
                "speed_confidence": s.speed_confidence,
                "is_hit": s.is_hit_event
            } for s in shuttle_dets
        ]
    }

@router.put("/shots/{shot_id}", response_model=ShotEventResponse)
def correct_shot(
    shot_id: int,
    req: ShotCorrectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shot = db.query(ShotEvent).join(Match).filter(
        ShotEvent.id == shot_id,
        Match.user_id == current_user.id
    ).first()
    if not shot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shot event not found.")

    shot.shot_type = req.shot_type
    shot.is_user_corrected = True
    shot.confidence = 1.0 # User manually certified
    db.commit()
    db.refresh(shot)
    return ShotEventResponse.model_validate(shot)

@router.put("/rallies/{rally_id}/verify", response_model=RallyEventResponse)
def verify_rally(
    rally_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rally = db.query(RallyEvent).join(Match).filter(
        RallyEvent.id == rally_id,
        Match.user_id == current_user.id
    ).first()
    if not rally:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rally event not found.")

    rally.is_verified = True
    db.commit()
    db.refresh(rally)
    return RallyEventResponse.model_validate(rally)

