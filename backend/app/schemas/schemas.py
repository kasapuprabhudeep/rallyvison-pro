from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.entities import UserRole, MatchType, AnalysisStatus, ShotType

# Auth & User schemas
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    role: UserRole = UserRole.PLAYER

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    two_factor_code: Optional[str] = None

class TwoFactorVerifyRequest(BaseModel):
    email: EmailStr
    two_factor_code: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str = Field(..., min_length=8)

class PrivacySettingsUpdate(BaseModel):
    is_profile_private: Optional[bool] = None
    share_anonymous_telemetry: Optional[bool] = None
    allow_ai_model_training: Optional[bool] = None
    video_retention_days: Optional[int] = None
    two_factor_enabled: Optional[bool] = None

class PrivacySettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    is_profile_private: bool = True
    share_anonymous_telemetry: bool = False
    allow_ai_model_training: bool = False
    video_retention_days: int = 90
    data_encryption_standard: str = "AES-256-GCM"
    two_factor_enabled: bool = False
    two_factor_backup_code: Optional[str] = None

class DeleteAccountRequest(BaseModel):
    password: str
    confirmation_text: str

class TokenResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    user: Optional["UserResponse"] = None
    requires_two_factor: bool = False
    two_factor_code_hint: Optional[str] = None
    message: Optional[str] = None

class UserProfileUpdate(BaseModel):
    dominant_hand: Optional[str] = "RIGHT"
    preferred_court_position: Optional[str] = "ALL_ROUND"
    play_level: Optional[str] = "INTERMEDIATE"
    bio: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    is_profile_private: Optional[bool] = None
    share_anonymous_telemetry: Optional[bool] = None
    allow_ai_model_training: Optional[bool] = None
    video_retention_days: Optional[int] = None
    two_factor_enabled: Optional[bool] = None

class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    dominant_hand: str
    preferred_court_position: str
    play_level: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    is_profile_private: bool = True
    share_anonymous_telemetry: bool = False
    allow_ai_model_training: bool = False
    video_retention_days: int = 90
    data_encryption_standard: str = "AES-256-GCM"
    two_factor_enabled: bool = False

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    profile: Optional[UserProfileResponse] = None

# Match & Video schemas
class MatchCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    match_type: MatchType = MatchType.SINGLES
    match_date: Optional[datetime] = None
    player_position: str = "NEAR_COURT"
    opponent_name: Optional[str] = None
    notes: Optional[str] = None

class VideoMetadataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    duration_seconds: float
    frame_count: int
    fps: float
    width: int
    height: int
    codec: Optional[str] = None
    bitrate: Optional[int] = None

class VideoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    file_size_bytes: int
    thumbnail_path: Optional[str] = None
    created_at: datetime
    metadata_info: Optional[VideoMetadataResponse] = None

# Court Calibration schemas
class CornerPoint(BaseModel):
    x: float # 0.0 to 1.0 (normalized)
    y: float # 0.0 to 1.0 (normalized)

class CourtCalibrationUpdate(BaseModel):
    corners: List[CornerPoint] # exactly 4 points: [top-left, top-right, bottom-right, bottom-left]
    court_type: str = "SINGLES" # SINGLES or DOUBLES
    is_manual_override: bool = True

class CourtCalibrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    match_id: int
    is_calibrated: bool
    is_manual_override: bool
    corners: List[Dict[str, float]]
    court_type: str
    calibration_confidence: float
    calibrated_at: datetime

# Shot & Rally schemas
class ShotEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    timestamp: float
    shot_type: ShotType
    confidence: float
    hitting_player_id: int
    court_x_m: Optional[float] = None
    court_y_m: Optional[float] = None
    is_user_corrected: bool

class ShotCorrectionRequest(BaseModel):
    shot_type: ShotType

class RallyEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    rally_number: int
    start_timestamp: float
    end_timestamp: float
    duration_seconds: float
    shot_count: int
    winning_player_id: Optional[int] = None
    is_verified: bool

# Analytics schemas
class MatchAnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    total_movement_distance_m: float
    avg_movement_speed_kmh: float
    max_movement_speed_kmh: float
    active_play_duration_sec: float
    rest_duration_sec: float
    work_to_rest_ratio: float
    total_rallies: int
    avg_rally_duration_sec: float
    longest_rally_sec: float
    shortest_rally_sec: float
    total_shots: int
    avg_shots_per_rally: float
    shot_distribution: Dict[str, int]
    court_zone_occupancy: Dict[str, float]
    base_recovery_rate_percent: float
    speed_series: List[Dict[str, Any]]
    estimated_calories_burned: Optional[int] = 0
    estimated_steps: Optional[int] = 0
    match_energy_score: Optional[int] = 75
    player_archetype: Optional[str] = "All-Round Dynamo 🏸"

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: str
    title: str
    observation: str
    recommendation: str
    priority: str
    grounded_metric: Optional[str] = None

class GeneratedReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    file_path: str
    file_size_bytes: int
    created_at: datetime

class MatchDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    match_type: MatchType
    match_date: datetime
    player_position: str
    opponent_name: Optional[str] = None
    notes: Optional[str] = None
    status: AnalysisStatus
    analysis_progress: float
    status_message: str
    is_public_shared: bool = False
    share_token: Optional[str] = None
    created_at: datetime
    video: Optional[VideoResponse] = None
    calibration: Optional[CourtCalibrationResponse] = None
    analytics: Optional[MatchAnalyticsResponse] = None
    recommendations: List[RecommendationResponse] = []
    reports: List[GeneratedReportResponse] = []

class ShareMatchResponse(BaseModel):
    match_id: int
    is_public_shared: bool
    share_token: Optional[str] = None
    share_url: Optional[str] = None

class SharedMatchPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    match_type: MatchType
    match_date: datetime
    player_position: str
    opponent_name: Optional[str] = None
    notes: Optional[str] = None
    status: AnalysisStatus
    player_name: str
    created_at: datetime
    analytics: Optional[MatchAnalyticsResponse] = None
    recommendations: List[RecommendationResponse] = []
    shot_events: List[ShotEventResponse] = []
    rally_events: List[RallyEventResponse] = []
    movement_tracks: List[Dict[str, Any]] = []
    has_pdf_report: bool = False

class DashboardSummaryResponse(BaseModel):
    total_matches_analyzed: int
    total_playing_time_sec: float
    avg_rally_duration_sec: float
    total_detected_shots: int
    total_movement_distance_m: float
    avg_movement_speed_kmh: float
    recent_matches: List[MatchDetailResponse]
    performance_trends: List[Dict[str, Any]]

class AICoachQueryRequest(BaseModel):
    query: str
    match_id: Optional[int] = None

class AICoachQueryResponse(BaseModel):
    answer: str
    grounded_metrics: Dict[str, Any] = {}
    suggested_followups: List[str] = []
    match_context_included: bool = False
    timestamp: datetime

