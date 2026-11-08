from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, Match, MatchAnalytics, AnalysisStatus
from app.schemas.schemas import DashboardSummaryResponse, MatchAnalyticsResponse, MatchDetailResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])

@router.get("/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch all completed matches for current user
    matches = db.query(Match).filter(
        Match.user_id == current_user.id
    ).order_by(Match.created_at.desc()).all()

    completed_matches = [m for m in matches if m.status == AnalysisStatus.COMPLETED and m.analytics is not None]

    total_matches_analyzed = len(completed_matches)
    total_playing_time_sec = sum(m.analytics.active_play_duration_sec for m in completed_matches)
    total_movement_distance_m = sum(m.analytics.total_movement_distance_m for m in completed_matches)
    total_detected_shots = sum(m.analytics.total_shots for m in completed_matches)

    avg_rally_duration_sec = 0.0
    avg_movement_speed_kmh = 0.0

    if total_matches_analyzed > 0:
        avg_rally_duration_sec = round(
            sum(m.analytics.avg_rally_duration_sec for m in completed_matches) / total_matches_analyzed, 2
        )
        avg_movement_speed_kmh = round(
            sum(m.analytics.avg_movement_speed_kmh for m in completed_matches) / total_matches_analyzed, 2
        )

    # Performance trends over time (chronological)
    trends = []
    for m in reversed(completed_matches):
        trends.append({
            "match_id": m.id,
            "title": m.title,
            "date": m.created_at.strftime("%b %d"),
            "distance_m": m.analytics.total_movement_distance_m,
            "avg_speed_kmh": m.analytics.avg_movement_speed_kmh,
            "max_speed_kmh": m.analytics.max_movement_speed_kmh,
            "total_shots": m.analytics.total_shots,
            "base_recovery_percent": m.analytics.base_recovery_rate_percent
        })

    recent_matches_detail = [MatchDetailResponse.model_validate(m) for m in matches[:6]]

    return DashboardSummaryResponse(
        total_matches_analyzed=total_matches_analyzed,
        total_playing_time_sec=round(total_playing_time_sec, 1),
        avg_rally_duration_sec=avg_rally_duration_sec,
        total_detected_shots=total_detected_shots,
        total_movement_distance_m=round(total_movement_distance_m, 1),
        avg_movement_speed_kmh=avg_movement_speed_kmh,
        recent_matches=recent_matches_detail,
        performance_trends=trends
    )

@router.get("/{match_id}", response_model=MatchAnalyticsResponse)
def get_match_analytics(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    if not match.analytics:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Analytics have not yet been generated for this match.")

    return MatchAnalyticsResponse.model_validate(match.analytics)

@router.get("/compare/matches")
def compare_matches(
    match_a: int = Query(...),
    match_b: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mA = db.query(Match).filter(Match.id == match_a, Match.user_id == current_user.id).first()
    mB = db.query(Match).filter(Match.id == match_b, Match.user_id == current_user.id).first()

    if not mA or not mB:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both matches not found.")

    if not mA.analytics or not mB.analytics:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Both matches must be completed to generate comparison.")

    return {
        "match_a": {
            "id": mA.id,
            "title": mA.title,
            "date": mA.match_date,
            "analytics": MatchAnalyticsResponse.model_validate(mA.analytics)
        },
        "match_b": {
            "id": mB.id,
            "title": mB.title,
            "date": mB.match_date,
            "analytics": MatchAnalyticsResponse.model_validate(mB.analytics)
        },
        "deltas": {
            "distance_m": round(mB.analytics.total_movement_distance_m - mA.analytics.total_movement_distance_m, 1),
            "speed_kmh": round(mB.analytics.avg_movement_speed_kmh - mA.analytics.avg_movement_speed_kmh, 2),
            "base_recovery_percent": round(mB.analytics.base_recovery_rate_percent - mA.analytics.base_recovery_rate_percent, 1),
            "shots": mB.analytics.total_shots - mA.analytics.total_shots,
            "rallies": mB.analytics.total_rallies - mA.analytics.total_rallies
        }
    }

