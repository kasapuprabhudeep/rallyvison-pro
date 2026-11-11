from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, Match, AICoachMessage
from app.schemas.schemas import (
    AICoachQueryRequest,
    AICoachQueryResponse,
    AICoachHistoryResponse,
    AICoachMessageResponse
)
from app.services.ai_coach import AICoachService
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Tactical Coach"])

@router.post("/ask", response_model=AICoachQueryResponse)
def ask_ai_coach(
    payload: AICoachQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    RallyCoach AI - Ask questions to your autonomous badminton coach.
    Answers are grounded in your private match telemetry, kinematics, and sports science.
    Enforces 100% privacy: users can only analyze their own match telemetry.
    Persists Q&A securely in the backend for rapid replay and historical tracking.
    """
    cleaned_query = payload.query.strip()
    if not cleaned_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty."
        )
    if len(cleaned_query) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query exceeds maximum allowed length of 2000 characters."
        )

    match = None
    if payload.match_id is not None:
        match = db.query(Match).filter(Match.id == payload.match_id, Match.user_id == current_user.id).first()
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found or access denied. You can only analyze your own private matches."
            )

    result = AICoachService.generate_coach_response(
        query=cleaned_query,
        user=current_user,
        match=match
    )

    # Persist question and response securely in backend database
    now_utc = datetime.now(timezone.utc)
    coach_msg = AICoachMessage(
        user_id=current_user.id,
        match_id=payload.match_id,
        query=cleaned_query,
        answer=result["answer"],
        grounded_metrics=result.get("grounded_metrics", {}),
        suggested_followups=result.get("suggested_followups", []),
        created_at=now_utc
    )
    db.add(coach_msg)
    db.commit()
    db.refresh(coach_msg)

    return AICoachQueryResponse(
        id=coach_msg.id,
        answer=coach_msg.answer,
        grounded_metrics=coach_msg.grounded_metrics or {},
        suggested_followups=coach_msg.suggested_followups or [],
        match_context_included=result.get("match_context_included", False),
        timestamp=coach_msg.created_at
    )

@router.get("/history", response_model=AICoachHistoryResponse)
def get_ai_coach_history(
    match_id: Optional[int] = Query(None, description="Optional match ID filter"),
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve previous RallyCoach AI questions and answers.
    Strict tenant privacy: only messages belonging to current_user are accessible.
    """
    query = db.query(AICoachMessage).filter(AICoachMessage.user_id == current_user.id)

    if match_id is not None:
        # Validate that the requested match belongs to current_user
        match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found or access denied."
            )
        query = query.filter(AICoachMessage.match_id == match_id)

    total_count = query.count()
    messages = query.order_by(AICoachMessage.created_at.asc()).offset(offset).limit(limit).all()

    return AICoachHistoryResponse(
        messages=messages,
        total_count=total_count
    )

@router.delete("/history")
def clear_ai_coach_history(
    match_id: Optional[int] = Query(None, description="Optional match ID filter to clear"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Purge coaching conversation history for current_user.
    Respects user privacy and GDPR data erasure guidelines.
    """
    query = db.query(AICoachMessage).filter(AICoachMessage.user_id == current_user.id)

    if match_id is not None:
        match = db.query(Match).filter(Match.id == match_id, Match.user_id == current_user.id).first()
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found or access denied."
            )
        query = query.filter(AICoachMessage.match_id == match_id)

    deleted_count = query.delete(synchronize_session=False)
    db.commit()

    return {
        "status": "success",
        "message": "Coaching conversation history cleared securely.",
        "deleted_count": deleted_count
    }

