import os
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, Match, AnalysisStatus, MovementTrack, ShotEvent, RallyEvent
from app.schemas.schemas import (
    MatchCreateRequest,
    MatchDetailResponse,
    ShareMatchResponse,
    SharedMatchPublicResponse,
    ShotEventResponse,
    RallyEventResponse
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/matches", tags=["Matches"])

@router.post("", response_model=MatchDetailResponse, status_code=status.HTTP_201_CREATED)
def create_match(
    req: MatchCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = Match(
        user_id=current_user.id,
        title=req.title.strip(),
        match_type=req.match_type,
        match_date=req.match_date,
        player_position=req.player_position,
        opponent_name=req.opponent_name.strip() if req.opponent_name else None,
        notes=req.notes.strip() if req.notes else None,
        status=AnalysisStatus.PENDING,
        status_message="Awaiting video upload"
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return MatchDetailResponse.model_validate(match)

@router.get("", response_model=List[MatchDetailResponse])
def list_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    matches = db.query(Match).filter(Match.user_id == current_user.id).order_by(Match.created_at.desc()).all()
    return [MatchDetailResponse.model_validate(m) for m in matches]

@router.get("/{match_id}", response_model=MatchDetailResponse)
def get_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")
    return MatchDetailResponse.model_validate(match)

@router.put("/{match_id}", response_model=MatchDetailResponse)
def update_match(
    match_id: int,
    req: MatchCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")
    
    match.title = req.title.strip()
    match.match_type = req.match_type
    if req.match_date:
        match.match_date = req.match_date
    match.player_position = req.player_position
    match.opponent_name = req.opponent_name.strip() if req.opponent_name else None
    match.notes = req.notes.strip() if req.notes else None

    db.commit()
    db.refresh(match)
    return MatchDetailResponse.model_validate(match)

@router.delete("/{match_id}")
def delete_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")
    
    # Remove files
    if match.video and os.path.exists(match.video.file_path):
        try:
            os.remove(match.video.file_path)
        except Exception:
            pass

    db.delete(match)
    db.commit()
    return {"message": "Match deleted successfully."}

# Public Share Access for Private Matches
@router.post("/{match_id}/share", response_model=ShareMatchResponse)
def enable_match_public_share(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    if not match.share_token:
        match.share_token = secrets.token_urlsafe(16)
    match.is_public_shared = True
    db.commit()
    db.refresh(match)

    return ShareMatchResponse(
        match_id=match.id,
        is_public_shared=True,
        share_token=match.share_token,
        share_url=f"/shared/match/{match.share_token}"
    )

@router.delete("/{match_id}/share", response_model=ShareMatchResponse)
def revoke_match_public_share(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    match.is_public_shared = False
    db.commit()
    db.refresh(match)

    return ShareMatchResponse(
        match_id=match.id,
        is_public_shared=False,
        share_token=None,
        share_url=None
    )

# Public Unauthenticated Endpoint: Anyone with the private share token can view this specific match report
@router.get("/shared/{share_token}", response_model=SharedMatchPublicResponse)
def get_shared_match_public(
    share_token: str,
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(
        Match.share_token == share_token,
        Match.is_public_shared == True
    ).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared match report was not found or public access has been revoked by the owner."
        )

    # Sample movement tracks for public tactical visualization
    tracks = db.query(MovementTrack).filter(
        MovementTrack.match_id == match.id
    ).order_by(MovementTrack.timestamp.asc()).all()
    step = max(1, len(tracks) // 250)
    sampled_tracks = [
        {
            "player_id": t.player_id,
            "timestamp": t.timestamp,
            "court_x_m": t.court_x_m,
            "court_y_m": t.court_y_m,
            "instant_speed_kmh": t.instant_speed_kmh,
            "court_zone": t.court_zone,
            "is_base_position": t.is_base_position
        }
        for t in tracks[::step]
    ]

    has_pdf = len(match.reports) > 0

    return SharedMatchPublicResponse(
        id=match.id,
        title=match.title,
        match_type=match.match_type,
        match_date=match.match_date,
        player_position=match.player_position,
        opponent_name=match.opponent_name,
        notes=match.notes,
        status=match.status,
        player_name=match.user.full_name if match.user else "RallyVision Player",
        created_at=match.created_at,
        analytics=match.analytics,
        recommendations=match.recommendations,
        shot_events=[ShotEventResponse.model_validate(s) for s in match.shot_events],
        rally_events=[RallyEventResponse.model_validate(r) for r in match.rally_events],
        movement_tracks=sampled_tracks,
        has_pdf_report=has_pdf
    )


