import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import BASE_DIR
from app.models.entities import User, Match, GeneratedReport
from app.schemas.schemas import GeneratedReportResponse
from app.services.report_generator import ReportGenerator
from app.api.deps import get_current_user, get_user_from_token

router = APIRouter(prefix="/reports", tags=["PDF Performance Reports"])

@router.post("/{match_id}/generate", response_model=GeneratedReportResponse)
def generate_report(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    if not match.analytics:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Match must be analyzed before report generation.")

    pdf_path = ReportGenerator.generate_pdf_report(
        match_id=match.id,
        match_data={"title": match.title, "match_type": match.match_type.value, "opponent_name": match.opponent_name, "created_at": str(match.created_at)},
        user_data={"full_name": match.user.full_name},
        analytics={
            "total_movement_distance_m": match.analytics.total_movement_distance_m,
            "avg_movement_speed_kmh": match.analytics.avg_movement_speed_kmh,
            "max_movement_speed_kmh": match.analytics.max_movement_speed_kmh,
            "base_recovery_rate_percent": match.analytics.base_recovery_rate_percent,
            "total_rallies": match.analytics.total_rallies,
            "avg_rally_duration_sec": match.analytics.avg_rally_duration_sec,
            "total_shots": match.analytics.total_shots,
            "avg_shots_per_rally": match.analytics.avg_shots_per_rally,
            "work_to_rest_ratio": match.analytics.work_to_rest_ratio,
            "shot_distribution": match.analytics.shot_distribution or {},
            "court_zone_occupancy": match.analytics.court_zone_occupancy or {}
        },
        recommendations=[
            {
                "category": r.category,
                "title": r.title,
                "observation": r.observation,
                "recommendation": r.recommendation,
                "priority": r.priority
            } for r in match.recommendations
        ],
        video_metadata={
            "duration_seconds": match.video.metadata_info.duration_seconds if match.video and match.video.metadata_info else 0,
            "fps": match.video.metadata_info.fps if match.video and match.video.metadata_info else 30.0,
            "width": match.video.metadata_info.width if match.video and match.video.metadata_info else 1920,
            "height": match.video.metadata_info.height if match.video and match.video.metadata_info else 1080
        }
    )

    db.query(GeneratedReport).filter(GeneratedReport.match_id == match.id).delete()
    report = GeneratedReport(
        match_id=match.id,
        title=f"Performance Report - {match.title}",
        file_path=pdf_path,
        file_size_bytes=15000
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return GeneratedReportResponse.model_validate(report)

@router.get("/{report_id}")
def get_report_info(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(GeneratedReport).join(Match).filter(
        GeneratedReport.id == report_id,
        Match.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return GeneratedReportResponse.model_validate(report)

@router.get("/{report_id}/download")
def download_pdf_report(
    report_id: int,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    token_str = token
    if not token_str and authorization and authorization.startswith("Bearer "):
        token_str = authorization.split(" ")[1]

    user = get_user_from_token(token_str, db) if token_str else None

    report = db.query(GeneratedReport).join(Match).filter(GeneratedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    is_owner = user is not None and report.match.user_id == user.id
    is_public = bool(report.match.is_public_shared)

    if not is_owner and not is_public:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to download report."
        )

    clean_rel = report.file_path.lstrip("/\\")
    full_path = BASE_DIR / clean_rel

    if not full_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found on server.")

    return FileResponse(
        str(full_path),
        media_type="application/pdf",
        filename=f"RallyVision_Report_Match_{report.match_id}.pdf"
    )

@router.get("/shared/{share_token}/download")
def download_shared_pdf_report(
    share_token: str,
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(
        Match.share_token == share_token,
        Match.is_public_shared == True
    ).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared match report not found or sharing disabled.")

    report = db.query(GeneratedReport).filter(GeneratedReport.match_id == match.id).order_by(GeneratedReport.created_at.desc()).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF report has not yet been generated for this match.")

    clean_rel = report.file_path.lstrip("/\\")
    full_path = BASE_DIR / clean_rel

    if not full_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found on server.")

    return FileResponse(
        str(full_path),
        media_type="application/pdf",
        filename=f"RallyVision_Report_{match.title.replace(' ', '_')}.pdf"
    )


