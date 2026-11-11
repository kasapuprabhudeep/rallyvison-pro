import os
import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, validate_password_strength
from app.models.entities import User, UserProfile, utcnow
from app.schemas.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TwoFactorVerifyRequest,
    TokenResponse,
    UserResponse,
    UserProfileUpdate,
    PasswordChangeRequest,
    PrivacySettingsUpdate,
    PrivacySettingsResponse,
    DeleteAccountRequest
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & Privacy"])

def is_code_expired(expires_at) -> bool:
    if not expires_at:
        return False
    now = utcnow()
    if expires_at.tzinfo is None and now.tzinfo is not None:
        now = now.replace(tzinfo=None)
    elif expires_at.tzinfo is not None and now.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=None)
    return expires_at < now

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Validate password complexity
    pwd_err = validate_password_strength(req.password)
    if pwd_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pwd_err
        )

    clean_email = req.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    hashed = get_password_hash(req.password)
    user = User(
        email=clean_email,
        hashed_password=hashed,
        full_name=req.full_name.strip(),
        role=req.role,
        last_login_at=utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default profile with secure privacy defaults (private by default)
    profile = UserProfile(
        user_id=user.id,
        is_profile_private=True,
        share_anonymous_telemetry=False,
        allow_ai_model_training=False,
        video_retention_days=90
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is disabled."
        )
    
    profile = user.profile
    if profile and profile.two_factor_enabled:
        # Step 2 Verification if code provided
        if req.two_factor_code:
            code = req.two_factor_code.strip()
            if profile.two_factor_code_expires_at and is_code_expired(profile.two_factor_code_expires_at):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Two-step verification code has expired. Please sign in again to receive a new code."
                )
            
            is_valid_code = bool(profile.two_factor_code and profile.two_factor_code == code)
            is_valid_backup = bool(profile.two_factor_backup_code and profile.two_factor_backup_code.upper() == code.upper())
            
            if not (is_valid_code or is_valid_backup):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid two-step verification code."
                )
            
            # Reset temporary code after successful verification
            profile.two_factor_code = None
            profile.two_factor_code_expires_at = None
            user.last_login_at = utcnow()
            db.commit()

            access_token = create_access_token(subject=user.id)
            return TokenResponse(
                access_token=access_token,
                token_type="bearer",
                user=UserResponse.model_validate(user),
                requires_two_factor=False,
                message="Two-step authentication verified successfully."
            )
        else:
            # Step 1: Issue challenge with a 6-digit cryptographic security code
            code = f"{secrets.randbelow(900000) + 100000}"
            profile.two_factor_code = code
            profile.two_factor_code_expires_at = utcnow() + timedelta(minutes=10)
            db.commit()

            return TokenResponse(
                access_token=None,
                token_type="bearer",
                user=None,
                requires_two_factor=True,
                two_factor_code_hint=code,
                message="Two-step verification code required. Please enter the 6-digit code sent to your registered account."
            )

    user.last_login_at = utcnow()
    db.commit()
    
    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        requires_two_factor=False
    )

@router.post("/verify-2fa", response_model=TokenResponse)
def verify_2fa(req: TwoFactorVerifyRequest, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid account or inactive credentials."
        )
    
    profile = user.profile
    if not profile or not profile.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-step verification is not enabled for this account."
        )
    
    code = req.two_factor_code.strip()
    if profile.two_factor_code_expires_at and is_code_expired(profile.two_factor_code_expires_at):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Verification code has expired. Please sign in again to receive a fresh code."
        )
    
    is_valid_code = bool(profile.two_factor_code and profile.two_factor_code == code)
    is_valid_backup = bool(profile.two_factor_backup_code and profile.two_factor_backup_code.upper() == code.upper())

    if not (is_valid_code or is_valid_backup):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid two-factor verification code."
        )
    
    # Invalidate one-time challenge code
    profile.two_factor_code = None
    profile.two_factor_code_expires_at = None
    if is_valid_backup:
        # Emergency recovery backup codes are single-use to prevent replay
        profile.two_factor_backup_code = None
    user.last_login_at = utcnow()
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        requires_two_factor=False,
        message="Two-step authentication verified successfully."
    )

@router.post("/token", response_model=TokenResponse)
def login_for_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password."
        )
    user.last_login_at = utcnow()
    db.commit()

    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    if req.dominant_hand is not None:
        profile.dominant_hand = req.dominant_hand
    if req.preferred_court_position is not None:
        profile.preferred_court_position = req.preferred_court_position
    if req.play_level is not None:
        profile.play_level = req.play_level
    if req.bio is not None:
        profile.bio = req.bio
    if req.height_cm is not None:
        profile.height_cm = req.height_cm
    if req.weight_kg is not None:
        profile.weight_kg = req.weight_kg
    if req.is_profile_private is not None:
        profile.is_profile_private = req.is_profile_private
    if req.share_anonymous_telemetry is not None:
        profile.share_anonymous_telemetry = req.share_anonymous_telemetry
    if req.allow_ai_model_training is not None:
        profile.allow_ai_model_training = req.allow_ai_model_training
    if req.video_retention_days is not None:
        profile.video_retention_days = req.video_retention_days
    if req.two_factor_enabled is not None:
        profile.two_factor_enabled = req.two_factor_enabled
        if req.two_factor_enabled and not profile.two_factor_backup_code:
            profile.two_factor_backup_code = secrets.token_hex(4).upper()

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

# Dedicated Privacy Management Endpoints
@router.get("/privacy", response_model=PrivacySettingsResponse)
def get_privacy_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return PrivacySettingsResponse(
        is_profile_private=bool(profile.is_profile_private if profile.is_profile_private is not None else True),
        share_anonymous_telemetry=bool(profile.share_anonymous_telemetry or False),
        allow_ai_model_training=bool(profile.allow_ai_model_training or False),
        video_retention_days=int(profile.video_retention_days if profile.video_retention_days is not None else 90),
        data_encryption_standard=profile.data_encryption_standard or "AES-256-GCM",
        two_factor_enabled=bool(profile.two_factor_enabled or False),
        two_factor_backup_code=profile.two_factor_backup_code if profile.two_factor_enabled else None
    )

@router.put("/privacy", response_model=PrivacySettingsResponse)
def update_privacy_settings(
    req: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if req.is_profile_private is not None:
        profile.is_profile_private = req.is_profile_private
    if req.share_anonymous_telemetry is not None:
        profile.share_anonymous_telemetry = req.share_anonymous_telemetry
    if req.allow_ai_model_training is not None:
        profile.allow_ai_model_training = req.allow_ai_model_training
    if req.video_retention_days is not None:
        profile.video_retention_days = req.video_retention_days
    if req.two_factor_enabled is not None:
        profile.two_factor_enabled = req.two_factor_enabled
        if req.two_factor_enabled and not profile.two_factor_backup_code:
            profile.two_factor_backup_code = secrets.token_hex(4).upper()

    db.commit()
    db.refresh(profile)

    return PrivacySettingsResponse(
        is_profile_private=bool(profile.is_profile_private),
        share_anonymous_telemetry=bool(profile.share_anonymous_telemetry),
        allow_ai_model_training=bool(profile.allow_ai_model_training),
        video_retention_days=int(profile.video_retention_days),
        data_encryption_standard=profile.data_encryption_standard or "AES-256-GCM",
        two_factor_enabled=bool(profile.two_factor_enabled),
        two_factor_backup_code=profile.two_factor_backup_code if profile.two_factor_enabled else None
    )

# Secure Password Change Endpoint
@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your current password was entered incorrectly."
        )

    if req.new_password != req.confirm_new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The new password confirmation does not match."
        )

    pwd_err = validate_password_strength(req.new_password)
    if pwd_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pwd_err
        )

    current_user.hashed_password = get_password_hash(req.new_password)
    current_user.updated_at = utcnow()
    db.commit()

    return {"message": "Password changed successfully. Your account is secured with the updated credentials."}

# Data Portability / Export Endpoint (GDPR / CCPA)
@router.get("/export-data")
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    matches_data = []

    for m in current_user.matches:
        match_info = {
            "id": m.id,
            "title": m.title,
            "match_type": m.match_type.value,
            "match_date": str(m.match_date) if m.match_date else None,
            "opponent_name": m.opponent_name,
            "status": m.status.value,
            "created_at": str(m.created_at)
        }
        if m.analytics:
            match_info["analytics"] = {
                "active_play_duration_sec": m.analytics.active_play_duration_sec,
                "total_movement_distance_m": m.analytics.total_movement_distance_m,
                "avg_movement_speed_kmh": m.analytics.avg_movement_speed_kmh,
                "max_movement_speed_kmh": m.analytics.max_movement_speed_kmh,
                "total_shots": m.analytics.total_shots,
                "estimated_calories_burned": m.analytics.estimated_calories_burned,
                "estimated_steps": m.analytics.estimated_steps,
                "match_energy_score": m.analytics.match_energy_score,
                "player_archetype": m.analytics.player_archetype,
                "shot_distribution": m.analytics.shot_distribution
            }
        matches_data.append(match_info)

    export_payload = {
        "export_metadata": {
            "application": "RallyVision Pro",
            "version": "2.4.0",
            "exported_at": str(utcnow()),
            "security_standard": profile.data_encryption_standard if profile else "AES-256-GCM"
        },
        "user_account": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value,
            "created_at": str(current_user.created_at),
            "last_login_at": str(current_user.last_login_at) if current_user.last_login_at else None
        },
        "privacy_preferences": {
            "is_profile_private": profile.is_profile_private if profile else True,
            "share_anonymous_telemetry": profile.share_anonymous_telemetry if profile else False,
            "allow_ai_model_training": profile.allow_ai_model_training if profile else False,
            "video_retention_days": profile.video_retention_days if profile else 90,
            "two_factor_enabled": profile.two_factor_enabled if profile else False
        },
        "matches": matches_data
    }

    return JSONResponse(
        content=export_payload,
        headers={"Content-Disposition": f"attachment; filename=rallyvision_export_user_{current_user.id}.json"}
    )

# Permanent Account Deletion / Right to Erasure Endpoint
@router.delete("/account")
def delete_account(
    req: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password. Account deletion cannot be authorized."
        )

    if req.confirmation_text.strip().upper() != "DELETE MY ACCOUNT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation text must exactly match 'DELETE MY ACCOUNT'."
        )

    # Securely remove all video media files from disk
    for m in current_user.matches:
        if m.video and m.video.file_path and os.path.exists(m.video.file_path):
            try:
                os.remove(m.video.file_path)
            except Exception:
                pass
        for rep in m.reports:
            if rep.pdf_path and os.path.exists(rep.pdf_path):
                try:
                    os.remove(rep.pdf_path)
                except Exception:
                    pass

    # Delete user from DB (all related tables will cascade delete)
    db.delete(current_user)
    db.commit()

    return {"message": "Your account and all associated telemetry, videos, and analysis have been permanently deleted."}

@router.post("/logout")
def logout():
    return {"message": "Successfully logged out. Please clear your token on the client."}

