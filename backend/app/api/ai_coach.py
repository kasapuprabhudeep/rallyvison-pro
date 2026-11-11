from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, Match
from app.schemas.schemas import AICoachQueryRequest, AICoachQueryResponse
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
    """
    match = None
    if payload.match_id is not None:
        match = db.query(Match).filter(Match.id == payload.match_id, Match.user_id == current_user.id).first()
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found or access denied. You can only analyze your own private matches."
            )

    result = AICoachService.generate_coach_response(
        query=payload.query,
        user=current_user,
        match=match
    )

    return AICoachQueryResponse(**result)
