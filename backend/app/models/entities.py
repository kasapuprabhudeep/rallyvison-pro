import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, 
    Text, JSON, Enum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base, engine

def utcnow():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    PLAYER = "PLAYER"
    COACH = "COACH"
    ADMINISTRATOR = "ADMINISTRATOR"

class MatchType(str, enum.Enum):
    SINGLES = "SINGLES"
    DOUBLES = "DOUBLES"

class AnalysisStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ShotType(str, enum.Enum):
    CLEAR = "CLEAR"
    DROP = "DROP"
    SMASH = "SMASH"
    DRIVE = "DRIVE"
    NET_SHOT = "NET_SHOT"
    LIFT = "LIFT"
    DEFENSIVE = "DEFENSIVE"
    UNKNOWN = "UNKNOWN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PLAYER, nullable=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="user", cascade="all, delete-orphan")
    ai_coach_messages = relationship("AICoachMessage", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    dominant_hand = Column(String(20), default="RIGHT") # RIGHT, LEFT
    preferred_court_position = Column(String(50), default="ALL_ROUND") # FORECOURT, REARCOURT, ALL_ROUND
    play_level = Column(String(50), default="INTERMEDIATE") # BEGINNER, INTERMEDIATE, ADVANCED, COMPETITIVE
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)

    # Privacy & Data Governance settings
    is_profile_private = Column(Boolean, default=True)
    share_anonymous_telemetry = Column(Boolean, default=False)
    allow_ai_model_training = Column(Boolean, default=False)
    video_retention_days = Column(Integer, default=90) # 0 = indefinite, 30, 90
    data_encryption_standard = Column(String(50), default="AES-256-GCM")
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_code = Column(String(10), nullable=True)
    two_factor_code_expires_at = Column(DateTime, nullable=True)
    two_factor_backup_code = Column(String(32), nullable=True)

    user = relationship("User", back_populates="profile")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    match_type = Column(Enum(MatchType), default=MatchType.SINGLES, nullable=False)
    match_date = Column(DateTime, default=utcnow)
    player_position = Column(String(50), default="NEAR_COURT") # NEAR_COURT, FAR_COURT, LEFT, RIGHT
    opponent_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING)
    analysis_progress = Column(Float, default=0.0) # 0 to 100%
    status_message = Column(String(255), default="Awaiting analysis")
    
    # Secure Public Sharing for Private Matches
    is_public_shared = Column(Boolean, default=False)
    share_token = Column(String(64), unique=True, index=True, nullable=True)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="matches")
    video = relationship("UploadedVideo", back_populates="match", uselist=False, cascade="all, delete-orphan")
    calibration = relationship("CourtCalibration", back_populates="match", uselist=False, cascade="all, delete-orphan")
    movement_tracks = relationship("MovementTrack", back_populates="match", cascade="all, delete-orphan")
    shuttlecock_detections = relationship("ShuttlecockDetection", back_populates="match", cascade="all, delete-orphan")
    shot_events = relationship("ShotEvent", back_populates="match", cascade="all, delete-orphan")
    rally_events = relationship("RallyEvent", back_populates="match", cascade="all, delete-orphan")
    analytics = relationship("MatchAnalytics", back_populates="match", uselist=False, cascade="all, delete-orphan")
    recommendations = relationship("PerformanceRecommendation", back_populates="match", cascade="all, delete-orphan")
    reports = relationship("GeneratedReport", back_populates="match", cascade="all, delete-orphan")
    ai_coach_messages = relationship("AICoachMessage", back_populates="match", cascade="all, delete-orphan")

class UploadedVideo(Base):
    __tablename__ = "uploaded_videos"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), unique=True, nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), default="video/mp4")
    thumbnail_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    match = relationship("Match", back_populates="video")
    metadata_info = relationship("VideoMetadata", back_populates="video", uselist=False, cascade="all, delete-orphan")

class VideoMetadata(Base):
    __tablename__ = "video_metadata"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("uploaded_videos.id", ondelete="CASCADE"), unique=True, nullable=False)
    duration_seconds = Column(Float, nullable=False)
    frame_count = Column(Integer, nullable=False)
    fps = Column(Float, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    codec = Column(String(50), nullable=True)
    bitrate = Column(Integer, nullable=True)

    video = relationship("UploadedVideo", back_populates="metadata_info")

class CourtCalibration(Base):
    __tablename__ = "court_calibrations"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), unique=True, nullable=False)
    is_calibrated = Column(Boolean, default=False)
    is_manual_override = Column(Boolean, default=False)
    # 4 corner coordinates in video frame space: [top_left, top_right, bottom_right, bottom_left]
    # Each corner is {"x": float, "y": float} normalized (0.0 to 1.0)
    corners = Column(JSON, nullable=False)
    # Homography matrix 3x3 serialized
    homography_matrix = Column(JSON, nullable=True)
    court_type = Column(String(50), default="SINGLES") # SINGLES, DOUBLES
    calibration_confidence = Column(Float, default=0.0)
    calibrated_at = Column(DateTime, default=utcnow)

    match = relationship("Match", back_populates="calibration")

class PlayerDetection(Base):
    __tablename__ = "player_detections"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    frame_index = Column(Integer, nullable=False, index=True)
    timestamp = Column(Float, nullable=False) # seconds
    player_id = Column(Integer, default=1) # 1, 2, 3, 4
    bbox_x1 = Column(Float, nullable=False)
    bbox_y1 = Column(Float, nullable=False)
    bbox_x2 = Column(Float, nullable=False)
    bbox_y2 = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    # Foot anchor coordinate in frame
    foot_x = Column(Float, nullable=False)
    foot_y = Column(Float, nullable=False)

class MovementTrack(Base):
    __tablename__ = "movement_tracks"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    frame_index = Column(Integer, nullable=False, index=True)
    timestamp = Column(Float, nullable=False)
    player_id = Column(Integer, default=1)
    # Metric court coordinates (0 to 13.4m, 0 to 5.18m / 6.1m)
    court_x_m = Column(Float, nullable=False)
    court_y_m = Column(Float, nullable=False)
    instant_speed_mps = Column(Float, default=0.0) # meters per second
    instant_speed_kmh = Column(Float, default=0.0) # km/h
    court_zone = Column(String(50), nullable=True) # FRONT_LEFT, FRONT_RIGHT, MID_LEFT, MID_RIGHT, REAR_LEFT, REAR_RIGHT
    is_base_position = Column(Boolean, default=False)

    match = relationship("Match", back_populates="movement_tracks")

class ShuttlecockDetection(Base):
    __tablename__ = "shuttlecock_detections"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    frame_index = Column(Integer, nullable=False, index=True)
    timestamp = Column(Float, nullable=False)
    x = Column(Float, nullable=True) # normalized frame x
    y = Column(Float, nullable=True) # normalized frame y
    court_x_m = Column(Float, nullable=True)
    court_y_m = Column(Float, nullable=True)
    confidence = Column(Float, default=0.0)
    is_hit_event = Column(Boolean, default=False)
    estimated_speed_kmh = Column(Float, nullable=True) # Only if confident
    speed_confidence = Column(String(20), default="UNRELIABLE") # HIGH, MEDIUM, LOW, UNRELIABLE

    match = relationship("Match", back_populates="shuttlecock_detections")

class ShotEvent(Base):
    __tablename__ = "shot_events"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    rally_id = Column(Integer, nullable=True)
    timestamp = Column(Float, nullable=False)
    shot_type = Column(Enum(ShotType), default=ShotType.UNKNOWN, nullable=False)
    confidence = Column(Float, default=0.0)
    hitting_player_id = Column(Integer, default=1)
    court_x_m = Column(Float, nullable=True)
    court_y_m = Column(Float, nullable=True)
    is_user_corrected = Column(Boolean, default=False)

    match = relationship("Match", back_populates="shot_events")

class RallyEvent(Base):
    __tablename__ = "rally_events"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    rally_number = Column(Integer, nullable=False)
    start_timestamp = Column(Float, nullable=False)
    end_timestamp = Column(Float, nullable=False)
    duration_seconds = Column(Float, nullable=False)
    shot_count = Column(Integer, default=0)
    winning_player_id = Column(Integer, nullable=True)
    is_verified = Column(Boolean, default=False) # Auto vs user-verified

    match = relationship("Match", back_populates="rally_events")

class MatchAnalytics(Base):
    __tablename__ = "match_analytics"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_movement_distance_m = Column(Float, default=0.0)
    avg_movement_speed_kmh = Column(Float, default=0.0)
    max_movement_speed_kmh = Column(Float, default=0.0)
    active_play_duration_sec = Column(Float, default=0.0)
    rest_duration_sec = Column(Float, default=0.0)
    work_to_rest_ratio = Column(Float, default=0.0)
    total_rallies = Column(Integer, default=0)
    avg_rally_duration_sec = Column(Float, default=0.0)
    longest_rally_sec = Column(Float, default=0.0)
    shortest_rally_sec = Column(Float, default=0.0)
    total_shots = Column(Integer, default=0)
    avg_shots_per_rally = Column(Float, default=0.0)
    
    # Detailed breakdown JSONs
    shot_distribution = Column(JSON, default=dict) # {"SMASH": 12, "CLEAR": 25, ...}
    court_zone_occupancy = Column(JSON, default=dict) # {"FRONT_LEFT": 15%, ...}
    base_recovery_rate_percent = Column(Float, default=0.0)
    speed_series = Column(JSON, default=list) # [{time, speed}]
    
    # Everyday / Fitness Metrics
    estimated_calories_burned = Column(Integer, default=0)
    estimated_steps = Column(Integer, default=0)
    match_energy_score = Column(Integer, default=75)
    player_archetype = Column(String(100), default="All-Round Dynamo 🏸")
    
    calculated_at = Column(DateTime, default=utcnow)

    match = relationship("Match", back_populates="analytics")

class PerformanceRecommendation(Base):
    __tablename__ = "performance_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False) # FOOTWORK, POSITIONING, SHOT_SELECTION, STAMINA, TACTICAL
    title = Column(String(255), nullable=False)
    observation = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM") # HIGH, MEDIUM, LOW
    grounded_metric = Column(String(100), nullable=True) # e.g. "Base recovery rate: 38%"
    created_at = Column(DateTime, default=utcnow)

    match = relationship("Match", back_populates="recommendations")

class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    match = relationship("Match", back_populates="reports")

class AICoachMessage(Base):
    __tablename__ = "ai_coach_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=True, index=True)
    query = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    grounded_metrics = Column(JSON, default=dict)
    suggested_followups = Column(JSON, default=list)
    created_at = Column(DateTime, default=utcnow, index=True)

    __table_args__ = (
        Index("ix_ai_coach_user_match", "user_id", "match_id"),
        Index("ix_ai_coach_user_created", "user_id", "created_at"),
    )

    user = relationship("User", back_populates="ai_coach_messages")
    match = relationship("Match", back_populates="ai_coach_messages")

# Automatically ensure all tables and indexes are created
Base.metadata.create_all(bind=engine)



