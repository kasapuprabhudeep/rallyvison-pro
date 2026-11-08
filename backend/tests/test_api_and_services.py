import pytest
import os
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.core.database import SessionLocal
from app.models.entities import ShotType, MatchType, AnalysisStatus
from app.api.auth import (
    register, login, update_profile, get_current_user_profile,
    get_privacy_settings, update_privacy_settings, change_password,
    export_user_data, delete_account
)
from app.api.matches import (
    create_match, list_matches, get_match, update_match, delete_match,
    enable_match_public_share, revoke_match_public_share, get_shared_match_public
)
from app.schemas.schemas import (
    UserRegisterRequest, UserLoginRequest, UserProfileUpdate, MatchCreateRequest,
    PasswordChangeRequest, PrivacySettingsUpdate, DeleteAccountRequest
)
from app.services.court_detector import CourtDetector
from app.services.shot_classifier import ShotClassifier
from app.services.rally_analyzer import RallyAnalyzer
from app.services.movement_analyzer import MovementAnalyzer
from app.services.recommendations import RecommendationEngine
from app.services.report_generator import ReportGenerator

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_auth_and_user_flow(db):
    test_email = f"player_{os.urandom(4).hex()}@rallyvision.pro"
    test_password = "SecurePassword123!"

    # 1. Register
    reg_req = UserRegisterRequest(
        email=test_email,
        password=test_password,
        full_name="Lee Chong Wei",
        role="PLAYER"
    )
    reg_res = register(reg_req, db)
    assert reg_res.access_token is not None
    assert reg_res.user.email == test_email
    assert reg_res.user.full_name == "Lee Chong Wei"
    user_id = reg_res.user.id

    # 2. Login
    login_req = UserLoginRequest(email=test_email, password=test_password)
    login_res = login(login_req, db)
    assert login_res.access_token is not None

    # 3. Update Profile
    from app.models.entities import User
    current_user = db.query(User).filter(User.id == user_id).first()
    update_req = UserProfileUpdate(
        dominant_hand="RIGHT",
        play_level="ADVANCED",
        bio="Singles speed specialist.",
        height_cm=175.0,
        weight_kg=68.0
    )
    updated = update_profile(update_req, current_user, db)
    assert updated.profile.play_level == "ADVANCED"
    assert updated.profile.dominant_hand == "RIGHT"

def test_matches_crud_flow(db):
    test_email = f"match_tester_{os.urandom(4).hex()}@rallyvision.pro"
    user_res = register(UserRegisterRequest(
        email=test_email,
        password="Password123!",
        full_name="Viktor Axelsen",
        role="PLAYER"
    ), db)
    
    from app.models.entities import User
    user = db.query(User).filter(User.id == user_res.user.id).first()

    # 1. Create Match
    m_req = MatchCreateRequest(
        title="All England Semi-Final",
        match_type=MatchType.SINGLES,
        player_position="NEAR_COURT",
        opponent_name="Shi Yuqi",
        notes="High tactical pace"
    )
    created = create_match(m_req, user, db)
    assert created.id is not None
    assert created.title == "All England Semi-Final"
    match_id = created.id

    # 2. List Matches
    all_matches = list_matches(user, db)
    assert len(all_matches) >= 1
    assert any(m.id == match_id for m in all_matches)

    # 3. Get Match
    fetched = get_match(match_id, user, db)
    assert fetched.id == match_id
    assert fetched.opponent_name == "Shi Yuqi"

    # 4. Update Match
    update_req = MatchCreateRequest(
        title="All England Final",
        match_type=MatchType.SINGLES,
        player_position="NEAR_COURT",
        opponent_name="Shi Yuqi",
        notes="Updated notes"
    )
    updated_m = update_match(match_id, update_req, user, db)
    assert updated_m.title == "All England Final"

    # 5. Delete Match
    del_res = delete_match(match_id, user, db)
    assert del_res["message"] == "Match deleted successfully."

def test_court_homography_and_zones():
    corners = [
        {"x": 0.25, "y": 0.20},
        {"x": 0.75, "y": 0.20},
        {"x": 0.90, "y": 0.90},
        {"x": 0.10, "y": 0.90}
    ]
    H = CourtDetector.calculate_homography(corners, img_width=1920, img_height=1080, court_type="SINGLES")
    assert H is not None
    assert H.shape == (3, 3)

    cx, cy = CourtDetector.transform_pixel_to_court(H, 0.25 * 1920, 0.20 * 1080)
    assert abs(cx - 0.0) < 0.1
    assert abs(cy - 0.0) < 0.1

    zone_front = CourtDetector.get_court_zone(1.0, 2.0, "SINGLES")
    assert zone_front == "FRONT_LEFT"

    zone_rear = CourtDetector.get_court_zone(4.5, 11.5, "SINGLES")
    assert zone_rear == "REAR_RIGHT"

def test_shot_classifier_logic():
    smash_res = ShotClassifier.classify_shot_event(
        hit_timestamp=14.5,
        player_track={"court_x_m": 2.5, "court_y_m": 12.0, "court_zone": "REAR_RIGHT", "player_id": 1},
        shuttle_data={"court_x_m": 2.6, "court_y_m": 11.8},
        speed_kmh=240.0
    )
    assert smash_res["shot_type"] == ShotType.SMASH

    net_res = ShotClassifier.classify_shot_event(
        hit_timestamp=22.1,
        player_track={"court_x_m": 1.5, "court_y_m": 6.8, "court_zone": "FRONT_LEFT", "player_id": 1},
        shuttle_data={"court_x_m": 1.4, "court_y_m": 6.7},
        speed_kmh=45.0
    )
    assert net_res["shot_type"] == ShotType.NET_SHOT

def test_rally_analyzer():
    shots = [
        {"timestamp": 5.0, "shot_type": "CLEAR"},
        {"timestamp": 7.0, "shot_type": "DROP"},
        {"timestamp": 9.5, "shot_type": "SMASH"},
        {"timestamp": 12.0, "shot_type": "DEFENSIVE"},
        {"timestamp": 22.0, "shot_type": "LIFT"},
        {"timestamp": 25.0, "shot_type": "SMASH"}
    ]
    rallies = RallyAnalyzer.segment_rallies(total_duration_sec=30.0, player_tracks=[], shot_events=shots, pause_threshold_sec=5.0)
    assert len(rallies) == 2
    assert rallies[0]["rally_number"] == 1
    assert rallies[0]["shot_count"] == 4
    assert rallies[1]["rally_number"] == 2
    assert rallies[1]["shot_count"] == 2

def test_movement_analyzer():
    tracks = [
        {"player_id": 1, "timestamp": 0.0, "court_x_m": 2.5, "court_y_m": 9.5, "instant_speed_kmh": 0.0, "court_zone": "MID_LEFT", "is_base_position": True},
        {"player_id": 1, "timestamp": 1.0, "court_x_m": 2.5, "court_y_m": 11.5, "instant_speed_kmh": 7.2, "court_zone": "REAR_LEFT", "is_base_position": False},
        {"player_id": 1, "timestamp": 2.0, "court_x_m": 2.5, "court_y_m": 9.5, "instant_speed_kmh": 7.2, "court_zone": "MID_LEFT", "is_base_position": True},
    ]
    analysis = MovementAnalyzer.analyze_movement(tracks, court_calibrated=True)
    assert analysis["total_movement_distance_m"] >= 4.0
    assert analysis["avg_movement_speed_kmh"] > 0.0
    assert analysis["base_recovery_rate_percent"] > 50.0

def test_pdf_report_generation():
    pdf_rel = ReportGenerator.generate_pdf_report(
        match_id=999,
        match_data={"title": "Test Championship", "match_type": "SINGLES", "opponent_name": "Kento Momota", "created_at": "2026-11-04"},
        user_data={"full_name": "Test Athlete"},
        analytics={
            "total_movement_distance_m": 420.5,
            "avg_movement_speed_kmh": 6.8,
            "max_movement_speed_kmh": 14.5,
            "base_recovery_rate_percent": 62.0,
            "total_rallies": 18,
            "avg_rally_duration_sec": 8.4,
            "total_shots": 74,
            "avg_shots_per_rally": 4.1,
            "work_to_rest_ratio": 0.65,
            "shot_distribution": {"SMASH": 14, "CLEAR": 28, "DROP": 12, "NET_SHOT": 10, "DRIVE": 10},
            "court_zone_occupancy": {"FRONT_LEFT": 15.0, "FRONT_RIGHT": 12.0, "MID_LEFT": 25.0, "MID_RIGHT": 22.0, "REAR_LEFT": 14.0, "REAR_RIGHT": 12.0}
        },
        recommendations=[
            {
                "category": "POSITIONING",
                "title": "Maintain Central Reset Discipline",
                "observation": "Base recovery consistently met target thresholds.",
                "recommendation": "Continue split-step timing.",
                "priority": "LOW"
            }
        ],
        video_metadata={"duration_seconds": 360.0, "fps": 30.0, "width": 1920, "height": 1080}
    )
    assert pdf_rel.endswith(".pdf")
    full_path = Path("storage/reports") / "rallyvision_report_match_999.pdf"
    assert full_path.exists()
    assert full_path.stat().st_size > 1000

def test_privacy_and_security_controls(db):
    from fastapi import HTTPException
    from pydantic import ValidationError
    from app.models.entities import User

    test_email = f"privacy_user_{os.urandom(4).hex()}@rallyvision.pro"
    initial_pwd = "SecurePass123!"

    # 1. Registration with password complexity check
    # Less than 8 characters fails Pydantic schema validation
    with pytest.raises(ValidationError):
        UserRegisterRequest(
            email=test_email,
            password="123",
            full_name="Privacy Athlete",
            role="PLAYER"
        )

    # Password without numbers/special chars fails password complexity validation
    with pytest.raises(HTTPException) as exc_info:
        register(UserRegisterRequest(
            email=test_email,
            password="alllettersonlypassword",
            full_name="Privacy Athlete",
            role="PLAYER"
        ), db)
    assert exc_info.value.status_code == 400

    # Valid registration
    reg_res = register(UserRegisterRequest(
        email=test_email,
        password=initial_pwd,
        full_name="Privacy Athlete",
        role="PLAYER"
    ), db)
    user_id = reg_res.user.id
    current_user = db.query(User).filter(User.id == user_id).first()

    # 2. Verify privacy defaults (Strict private by default)
    privacy = get_privacy_settings(current_user, db)
    assert privacy.is_profile_private is True
    assert privacy.share_anonymous_telemetry is False
    assert privacy.allow_ai_model_training is False
    assert privacy.video_retention_days == 90
    assert privacy.data_encryption_standard == "AES-256-GCM"

    # 3. Update privacy preferences
    updated_privacy = update_privacy_settings(
        PrivacySettingsUpdate(
            is_profile_private=True,
            share_anonymous_telemetry=True,
            allow_ai_model_training=False,
            video_retention_days=30,
            two_factor_enabled=True
        ),
        current_user,
        db
    )
    assert updated_privacy.share_anonymous_telemetry is True
    assert updated_privacy.video_retention_days == 30
    assert updated_privacy.two_factor_enabled is True

    # 4. Password change security check
    # Wrong current password should fail
    with pytest.raises(HTTPException):
        change_password(
            PasswordChangeRequest(
                current_password="WrongOldPassword!",
                new_password="NewSecurePassword456!",
                confirm_new_password="NewSecurePassword456!"
            ),
            current_user,
            db
        )

    # Mismatched confirmation should fail
    with pytest.raises(HTTPException):
        change_password(
            PasswordChangeRequest(
                current_password=initial_pwd,
                new_password="NewSecurePassword456!",
                confirm_new_password="DifferentConfirmation456!"
            ),
            current_user,
            db
        )

    # Successful password change
    new_pwd = "NewSecurePassword456!"
    change_res = change_password(
        PasswordChangeRequest(
            current_password=initial_pwd,
            new_password=new_pwd,
            confirm_new_password=new_pwd
        ),
        current_user,
        db
    )
    assert "successfully" in change_res["message"]

    # Verify login with new password works (handling 2FA challenge appropriately)
    login_challenge = login(UserLoginRequest(email=test_email, password=new_pwd), db)
    assert login_challenge.requires_two_factor is True
    # Complete Step 2 with the issued verification code
    login_res = login(UserLoginRequest(email=test_email, password=new_pwd, two_factor_code=login_challenge.two_factor_code_hint), db)
    assert login_res.access_token is not None

    # 5. GDPR Data Export
    export_res = export_user_data(current_user, db)
    import json
    export_content = json.loads(export_res.body.decode("utf-8"))
    assert export_content["user_account"]["email"] == test_email
    assert export_content["privacy_preferences"]["share_anonymous_telemetry"] is True
    assert "matches" in export_content

    # 6. Account & Data Purge (Right to Erasure)
    # Incorrect confirmation text should fail
    with pytest.raises(HTTPException):
        delete_account(
            DeleteAccountRequest(
                password=new_pwd,
                confirmation_text="WRONG CONFIRMATION"
            ),
            current_user,
            db
        )

    # Correct purge
    del_res = delete_account(
        DeleteAccountRequest(
            password=new_pwd,
            confirmation_text="DELETE MY ACCOUNT"
        ),
        current_user,
        db
    )
    assert "deleted" in del_res["message"] or "purged" in del_res["message"]

    # Verify user is completely removed from database
    deleted_check = db.query(User).filter(User.id == user_id).first()
    assert deleted_check is None

def test_public_share_for_private_match(db):
    from fastapi import HTTPException
    from app.models.entities import User

    test_email = f"sharer_{os.urandom(4).hex()}@rallyvision.pro"
    user_res = register(UserRegisterRequest(
        email=test_email,
        password="Password123!",
        full_name="Carolina Marin",
        role="PLAYER"
    ), db)
    user = db.query(User).filter(User.id == user_res.user.id).first()

    # 1. Create Private Match
    match = create_match(
        MatchCreateRequest(
            title="World Championship Final",
            match_type=MatchType.SINGLES,
            player_position="NEAR_COURT",
            opponent_name="Tai Tzu-ying"
        ),
        user,
        db
    )
    assert match.is_public_shared is False
    assert match.share_token is None

    # 2. Enable public share link for this private match
    share_res = enable_match_public_share(match.id, user, db)
    assert share_res.is_public_shared is True
    assert share_res.share_token is not None
    token = share_res.share_token

    # 3. Public User accesses shared match without authentication
    public_view = get_shared_match_public(token, db)
    assert public_view.id == match.id
    assert public_view.title == "World Championship Final"
    assert public_view.player_name == "Carolina Marin"

    # 4. Owner revokes public share access
    revoke_res = revoke_match_public_share(match.id, user, db)
    assert revoke_res.is_public_shared is False

    # 5. Public access now returns 404
    with pytest.raises(HTTPException) as exc_info:
        get_shared_match_public(token, db)
    assert exc_info.value.status_code == 404


