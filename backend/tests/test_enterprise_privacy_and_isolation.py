import pytest
import os
import sys
from pathlib import Path
from fastapi import HTTPException

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from datetime import timedelta
from app.core.database import SessionLocal
from app.models.entities import User, Match, MatchType, AnalysisStatus, UploadedVideo, VideoMetadata, MatchAnalytics, utcnow
from app.schemas.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TwoFactorVerifyRequest,
    PrivacySettingsUpdate,
    MatchCreateRequest,
    CourtCalibrationUpdate,
    ShotCorrectionRequest
)
from app.api.auth import register, login, verify_2fa, update_privacy_settings
from app.api.matches import (
    create_match, list_matches, get_match, update_match, delete_match,
    enable_match_public_share, revoke_match_public_share, get_shared_match_public
)
from app.api.court import get_calibration_frame, get_court_calibration, update_court_calibration
from app.api.analysis import start_analysis, get_analysis_status, get_analysis_results
from app.api.analytics import get_dashboard_summary, get_match_analytics, compare_matches
from app.api.reports import generate_report, get_report_info, download_pdf_report
from app.api.videos import get_video_info, stream_video

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_enterprise_two_step_certification_privacy_and_isolation(db):
    """
    ENTERPRISE STEP 1: Multi-Tenant Data Isolation & Cross-User Privacy Test.
    Strictly verifies that User B cannot access, list, modify, analyze, stream,
    or delete User A's private badminton data.
    """
    # 1. Register User A (Legitimate Match Owner)
    user_a_email = f"player_a_{os.urandom(4).hex()}@badminton.org"
    user_a_res = register(UserRegisterRequest(
        email=user_a_email,
        password="AthletePass123!",
        full_name="User A (Pro Player)",
        role="PLAYER"
    ), db)
    user_a = db.query(User).filter(User.id == user_a_res.user.id).first()

    # 2. Register User B (Unrelated User / Potential Attacker)
    user_b_email = f"player_b_{os.urandom(4).hex()}@badminton.org"
    user_b_res = register(UserRegisterRequest(
        email=user_b_email,
        password="AttackerPass123!",
        full_name="User B (Competitor)",
        role="PLAYER"
    ), db)
    user_b = db.query(User).filter(User.id == user_b_res.user.id).first()

    # 3. User A creates private championship match
    match_a = create_match(
        MatchCreateRequest(
            title="User A Private Final",
            match_type=MatchType.SINGLES,
            player_position="NEAR_COURT",
            opponent_name="Olympic Rival",
            notes="Confidential tactical strategy"
        ),
        user_a,
        db
    )
    match_a_id = match_a.id

    # Attach sample video and analytics to Match A
    test_video = UploadedVideo(
        match_id=match_a_id,
        filename="user_a_secret_rally.mp4",
        file_path="storage/videos/test_sample.mp4",
        file_size_bytes=5000000,
        mime_type="video/mp4"
    )
    db.add(test_video)
    db.commit()
    db.refresh(test_video)

    test_analytics = MatchAnalytics(
        match_id=match_a_id,
        total_movement_distance_m=850.5,
        avg_movement_speed_kmh=8.2,
        max_movement_speed_kmh=18.4,
        base_recovery_rate_percent=68.5,
        total_rallies=24,
        avg_rally_duration_sec=9.1,
        total_shots=96,
        avg_shots_per_rally=4.0,
        work_to_rest_ratio=0.72,
        estimated_calories_burned=420,
        estimated_steps=1180,
        match_energy_score=92,
        player_archetype="Speed Attacker 🏸",
        shot_distribution={"SMASH": 28, "CLEAR": 24, "DROP": 22, "NET_SHOT": 22},
        court_zone_occupancy={"FRONT_LEFT": 15.0, "FRONT_RIGHT": 15.0, "MID_LEFT": 25.0, "MID_RIGHT": 25.0, "REAR_LEFT": 10.0, "REAR_RIGHT": 10.0}
    )
    db.add(test_analytics)
    match_a.status = AnalysisStatus.COMPLETED
    db.commit()

    # --- CROSS-TENANT INTRUSION CHECKS ---

    # Test 1: User B tries to view Match A details
    with pytest.raises(HTTPException) as exc:
        get_match(match_a_id, user_b, db)
    assert exc.value.status_code == 404

    # Test 2: User B lists matches -> Match A must NOT appear
    b_matches = list_matches(user_b, db)
    assert all(m.id != match_a_id for m in b_matches)

    # Test 3: User B tries to update Match A
    with pytest.raises(HTTPException) as exc:
        update_match(match_a_id, MatchCreateRequest(
            title="Hacked Match Title",
            match_type=MatchType.SINGLES,
            player_position="NEAR_COURT"
        ), user_b, db)
    assert exc.value.status_code == 404

    # Test 4: User B tries to delete Match A
    with pytest.raises(HTTPException) as exc:
        delete_match(match_a_id, user_b, db)
    assert exc.value.status_code == 404
    # Verify Match A still exists safely
    assert db.query(Match).filter(Match.id == match_a_id).first() is not None

    # Test 5: User B tries to view Match A calibration or frame
    with pytest.raises(HTTPException) as exc:
        get_court_calibration(match_a_id, user_b, db)
    assert exc.value.status_code == 404

    # Test 6: User B tries to get Match A analytics
    with pytest.raises(HTTPException) as exc:
        get_match_analytics(match_a_id, user_b, db)
    assert exc.value.status_code == 404

    # Test 7: User B tries to compare Match A with their own match
    match_b = create_match(
        MatchCreateRequest(
            title="User B Match",
            match_type=MatchType.SINGLES,
            player_position="NEAR_COURT"
        ),
        user_b,
        db
    )
    with pytest.raises(HTTPException) as exc:
        compare_matches(match_a=match_a_id, match_b=match_b.id, current_user=user_b, db=db)
    assert exc.value.status_code == 404

    # Test 8: User B tries to generate or view report for Match A
    with pytest.raises(HTTPException) as exc:
        generate_report(match_a_id, user_b, db)
    assert exc.value.status_code == 404

    # Test 9: User B's dashboard must have 0 distance (cannot leak User A's distance)
    b_dashboard = get_dashboard_summary(user_b, db)
    assert b_dashboard.total_matches_analyzed == 0
    assert b_dashboard.total_movement_distance_m == 0.0

    # Test 10: Video Stream Security (Private video cannot be streamed without User A's authorization)
    with pytest.raises(HTTPException) as exc:
        stream_video(video_id=test_video.id, token=None, authorization=None, db=db)
    assert exc.value.status_code == 401

    # User B's token cannot stream User A's video
    user_b_token = user_b_res.access_token
    with pytest.raises(HTTPException) as exc:
        stream_video(video_id=test_video.id, token=user_b_token, authorization=None, db=db)
    assert exc.value.status_code == 401

def test_enterprise_two_step_certification_controlled_sharing_and_homography(db):
    """
    ENTERPRISE STEP 2: Controlled Granular Sharing, Homography Math, & Data Integrity.
    Verifies that public sharing is cryptographic and token-isolated,
    without leaking user passwords, emails, or unrelated matches.
    """
    from app.services.court_detector import CourtDetector
    from app.services.shot_classifier import ShotClassifier
    from app.services.recommendations import RecommendationEngine

    # 1. Create User and Match
    user_email = f"player_share_{os.urandom(4).hex()}@badminton.org"
    user_res = register(UserRegisterRequest(
        email=user_email,
        password="SharePass123!",
        full_name="P.V. Sindhu",
        role="PLAYER"
    ), db)
    user = db.query(User).filter(User.id == user_res.user.id).first()

    match = create_match(
        MatchCreateRequest(
            title="Olympic Semifinal Rally",
            match_type=MatchType.SINGLES,
            player_position="NEAR_COURT",
            opponent_name="Nozomi Okuhara"
        ),
        user,
        db
    )

    # 2. Cryptographic Share Token Verification
    share_res = enable_match_public_share(match.id, user, db)
    assert share_res.is_public_shared is True
    assert len(share_res.share_token) >= 16

    # Verify public view payload contains zero sensitive user credentials
    public_view = get_shared_match_public(share_res.share_token, db)
    assert public_view.title == "Olympic Semifinal Rally"
    # Ensure no hashed password or personal email leak in public view
    assert not hasattr(public_view, "password_hash")
    assert not hasattr(public_view, "email")

    # Revoke access -> Immediately cuts off public viewers
    revoke_res = revoke_match_public_share(match.id, user, db)
    assert revoke_res.is_public_shared is False

    with pytest.raises(HTTPException) as exc:
        get_shared_match_public(share_res.share_token, db)
    assert exc.value.status_code == 404

    # 3. Homography Coordinate Mathematical Bounds Verification
    # Test valid boundary homography
    corners = [
        {"x": 0.20, "y": 0.15},
        {"x": 0.80, "y": 0.15},
        {"x": 0.95, "y": 0.90},
        {"x": 0.05, "y": 0.90}
    ]
    H = CourtDetector.calculate_homography(corners, img_width=1920, img_height=1080, court_type="SINGLES")
    assert H is not None
    assert H.shape == (3, 3)

    # Corner (0,0) in court coordinates must map closely to top-left corner
    court_x, court_y = CourtDetector.transform_pixel_to_court(H, 0.20 * 1920, 0.15 * 1080)
    assert abs(court_x - 0.0) < 0.25
    assert abs(court_y - 0.0) < 0.25

    # Center T-mark check (mid-court net junction)
    center_zone = CourtDetector.get_court_zone(court_x_m=2.59, court_y_m=6.70, court_type="SINGLES")
    assert center_zone in ["FRONT_LEFT", "FRONT_RIGHT", "MID_LEFT", "MID_RIGHT"]

    # 4. Shot Classifier Robustness Under Out-of-Bounds Values
    # Speed extreme bounds check (e.g., 520 km/h world record smash)
    extreme_smash = ShotClassifier.classify_shot_event(
        hit_timestamp=10.0,
        player_track={"court_x_m": 2.5, "court_y_m": 12.0, "court_zone": "REAR_RIGHT", "player_id": 1},
        shuttle_data={"court_x_m": 2.5, "court_y_m": 11.5},
        speed_kmh=520.0
    )
    assert extreme_smash["shot_type"].value == "SMASH"
    assert extreme_smash["confidence"] >= 0.85

    # Low speed net spin check (e.g. 18 km/h rolling tumble)
    delicate_net = ShotClassifier.classify_shot_event(
        hit_timestamp=12.5,
        player_track={"court_x_m": 1.2, "court_y_m": 6.8, "court_zone": "FRONT_LEFT", "player_id": 1},
        shuttle_data={"court_x_m": 1.1, "court_y_m": 6.7},
        speed_kmh=18.0
    )
    assert delicate_net["shot_type"].value in ["NET_SHOT", "DROP"]

    # 5. Recommendation Engine Defensive Stability
    # Ensure engine handles empty shot distribution without dividing by zero
    empty_recs = RecommendationEngine.generate_recommendations(
        analytics={
            "base_recovery_rate_percent": 35.0,
            "avg_movement_speed_kmh": 0.0,
            "max_movement_speed_kmh": 0.0,
            "court_zone_occupancy": {}
        },
        shot_distribution={},
        total_shots=0
    )
    assert len(empty_recs) >= 1
    assert any(r["category"] == "POSITIONING" for r in empty_recs)


def test_enterprise_two_step_verification_lifecycle(db):
    """
    ENTERPRISE STEP 3: Cryptographic Two-Step Verification (2FA / Two-Factor Authentication).
    Tests the complete enterprise security contract:
    1. Account with 2FA disabled logs in normally with credentials.
    2. User enables 2FA and receives emergency recovery backup code.
    3. Login step 1 succeeds with credentials but DOES NOT return access token (issues 6-digit challenge).
    4. Submitting invalid 6-digit code fails with 401 Unauthorized.
    5. Submitting valid 6-digit code via verify-2fa succeeds and issues valid JWT access token.
    6. Replay attack: Re-using the same one-time code fails with 401.
    7. Emergency recovery: Using the generated backup code succeeds.
    8. Expired challenge: An expired verification code is rejected with 401.
    """
    # 1. Register User
    user_email = f"twofa_user_{os.urandom(4).hex()}@badminton.global"
    reg_res = register(UserRegisterRequest(
        email=user_email,
        password="SecurePass2026!",
        full_name="Global Badminton Athlete",
        role="PLAYER"
    ), db)
    user = db.query(User).filter(User.id == reg_res.user.id).first()

    # Normal login before 2FA is active
    login_step0 = login(UserLoginRequest(email=user_email, password="SecurePass2026!"), db)
    assert login_step0.access_token is not None
    assert login_step0.requires_two_factor is False

    # 2. Enable Two-Step Verification
    privacy_res = update_privacy_settings(
        PrivacySettingsUpdate(two_factor_enabled=True),
        user,
        db
    )
    assert privacy_res.two_factor_enabled is True
    assert privacy_res.two_factor_backup_code is not None
    backup_code = privacy_res.two_factor_backup_code
    assert len(backup_code) == 8

    # 3. Login Step 1: Provide valid email/password without 2FA code
    step1_res = login(UserLoginRequest(email=user_email, password="SecurePass2026!"), db)
    assert step1_res.requires_two_factor is True
    assert step1_res.access_token is None  # Token withheld until Step 2 is completed!
    assert step1_res.two_factor_code_hint is not None
    challenge_code = step1_res.two_factor_code_hint
    assert len(challenge_code) == 6

    # 4. Attempt Step 2 with incorrect code
    with pytest.raises(HTTPException) as exc_invalid:
        verify_2fa(TwoFactorVerifyRequest(email=user_email, two_factor_code="000000"), db)
    assert exc_invalid.value.status_code == 401

    # Also test via login endpoint with wrong code
    with pytest.raises(HTTPException) as exc_login_wrong:
        login(UserLoginRequest(email=user_email, password="SecurePass2026!", two_factor_code="999999"), db)
    assert exc_login_wrong.value.status_code == 401

    # 5. Complete Step 2 with valid challenge code
    step2_res = verify_2fa(TwoFactorVerifyRequest(email=user_email, two_factor_code=challenge_code), db)
    assert step2_res.access_token is not None
    assert step2_res.requires_two_factor is False
    assert step2_res.user.email == user_email

    # 6. Replay Attack Prevention: Code cannot be used twice
    with pytest.raises(HTTPException) as exc_replay:
        verify_2fa(TwoFactorVerifyRequest(email=user_email, two_factor_code=challenge_code), db)
    assert exc_replay.value.status_code == 401

    # 7. Emergency Backup Code Recovery
    # Trigger a new challenge
    step1_retry = login(UserLoginRequest(email=user_email, password="SecurePass2026!"), db)
    assert step1_retry.requires_two_factor is True
    # Verify using emergency backup code
    backup_login = login(UserLoginRequest(email=user_email, password="SecurePass2026!", two_factor_code=backup_code), db)
    assert backup_login.access_token is not None
    assert backup_login.requires_two_factor is False

    # 8. Expired Challenge Code Protection
    # Trigger another challenge
    step1_exp = login(UserLoginRequest(email=user_email, password="SecurePass2026!"), db)
    assert step1_exp.requires_two_factor is True
    exp_code = step1_exp.two_factor_code_hint
    # Manually backdate the expiration time to simulate timeout
    db.refresh(user)
    user.profile.two_factor_code_expires_at = utcnow() - timedelta(minutes=5)
    db.commit()

    with pytest.raises(HTTPException) as exc_expired:
        verify_2fa(TwoFactorVerifyRequest(email=user_email, two_factor_code=exp_code), db)
    assert exc_expired.value.status_code == 401
    assert "expired" in exc_expired.value.detail.lower()

def test_antivirus_and_malicious_file_auto_deletion():
    """
    ENTERPRISE STEP 4: Automated Antivirus & Malicious Binary Shredding Test.
    Verifies that disguised executables, malware strings, and script payloads
    are automatically blocked, shredded, and deleted from disk with zero server crashes.
    """
    from app.services.security_scanner import SecurityScanner
    import tempfile

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)

        # 1. Test Disguised Windows Executable (MZ header named as .mp4)
        malicious_exe = tmp_path / "trojan_disguised_as_badminton.mp4"
        with open(malicious_exe, "wb") as f:
            f.write(b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00" + b"\x00" * 200)

        assert malicious_exe.exists()
        is_clean, reason = SecurityScanner.scan_and_validate_video(malicious_exe)
        assert is_clean is False
        assert "malicious" in reason.lower() or "executable" in reason.lower()
        # Verify it was shredded and deleted automatically from disk!
        assert not malicious_exe.exists()

        # 2. Test Script Shellcode Payload Disguised as Video
        script_payload = tmp_path / "exploit.mp4"
        with open(script_payload, "wb") as f:
            f.write(b"#!/bin/bash\nrm -rf /\neval($_POST['cmd']);" + b"\x00" * 100)

        assert script_payload.exists()
        is_clean_script, reason_script = SecurityScanner.scan_and_validate_video(script_payload)
        assert is_clean_script is False
        assert not script_payload.exists()

        # 3. Test Genuine MP4 Video File Header
        clean_mp4 = tmp_path / "valid_match.mp4"
        with open(clean_mp4, "wb") as f:
            # Genuine MP4 ftyp box
            f.write(b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2mp41" + b"\x00" * 300)

        assert clean_mp4.exists()
        is_clean_mp4, reason_mp4 = SecurityScanner.scan_and_validate_video(clean_mp4)
        assert is_clean_mp4 is True
        assert clean_mp4.exists()
