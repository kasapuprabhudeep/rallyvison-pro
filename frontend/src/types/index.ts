export type UserRole = 'PLAYER' | 'COACH' | 'ADMINISTRATOR';

export interface PrivacySettings {
  is_profile_private: boolean;
  share_anonymous_telemetry: boolean;
  allow_ai_model_training: boolean;
  video_retention_days: number;
  data_encryption_standard: string;
  two_factor_enabled: boolean;
  two_factor_backup_code?: string;
}

export interface TokenResponse {
  access_token?: string;
  token_type?: string;
  user?: User;
  requires_two_factor?: boolean;
  two_factor_code_hint?: string;
  message?: string;
}

export interface TwoFactorVerifyRequest {
  email: string;
  two_factor_code: string;
}

export interface UserProfile {
  id: number;
  dominant_hand: string;
  preferred_court_position: string;
  play_level: string;
  bio?: string;
  avatar_url?: string;
  height_cm?: number;
  weight_kg?: number;
  is_profile_private?: boolean;
  share_anonymous_telemetry?: boolean;
  allow_ai_model_training?: boolean;
  video_retention_days?: number;
  data_encryption_standard?: string;
  two_factor_enabled?: boolean;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile?: UserProfile;
}

export interface VideoMetadata {
  duration_seconds: number;
  frame_count: number;
  fps: number;
  width: number;
  height: number;
  codec?: string;
  bitrate?: number;
}

export interface UploadedVideo {
  id: number;
  filename: string;
  file_size_bytes: number;
  thumbnail_path?: string;
  created_at: string;
  metadata_info?: VideoMetadata;
}

export interface CornerPoint {
  x: number; // 0.0 to 1.0 (normalized)
  y: number; // 0.0 to 1.0 (normalized)
}

export interface CourtCalibration {
  id: number;
  match_id: number;
  is_calibrated: boolean;
  is_manual_override: boolean;
  corners: CornerPoint[];
  court_type: 'SINGLES' | 'DOUBLES';
  calibration_confidence: number;
  calibrated_at: string;
}

export type ShotType =
  | 'CLEAR'
  | 'DROP'
  | 'SMASH'
  | 'DRIVE'
  | 'NET_SHOT'
  | 'LIFT'
  | 'DEFENSIVE'
  | 'UNKNOWN';

export interface ShotEvent {
  id: number;
  timestamp: number;
  shot_type: ShotType;
  confidence: number;
  hitting_player_id: number;
  court_x_m?: number;
  court_y_m?: number;
  is_user_corrected: boolean;
}

export interface RallyEvent {
  id: number;
  rally_number: number;
  start_timestamp: number;
  end_timestamp: number;
  duration_seconds: number;
  shot_count: number;
  winning_player_id?: number;
  is_verified: boolean;
}

export interface SpeedDataPoint {
  time: number;
  speed: number;
  zone?: string;
}

export interface MatchAnalytics {
  total_movement_distance_m: number;
  avg_movement_speed_kmh: number;
  max_movement_speed_kmh: number;
  active_play_duration_sec: number;
  rest_duration_sec: number;
  work_to_rest_ratio: number;
  total_rallies: number;
  avg_rally_duration_sec: number;
  longest_rally_sec: number;
  shortest_rally_sec: number;
  total_shots: number;
  avg_shots_per_rally: number;
  shot_distribution: Record<string, number>;
  court_zone_occupancy: Record<string, number>;
  base_recovery_rate_percent: number;
  speed_series: SpeedDataPoint[];
  estimated_calories_burned?: number;
  estimated_steps?: number;
  match_energy_score?: number;
  player_archetype?: string;
}

export interface PerformanceRecommendation {
  id: number;
  category: 'FOOTWORK' | 'POSITIONING' | 'SHOT_SELECTION' | 'STAMINA' | 'TACTICAL';
  title: string;
  observation: string;
  recommendation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  grounded_metric?: string;
}

export interface GeneratedReport {
  id: number;
  title: string;
  file_path: string;
  file_size_bytes: number;
  created_at: string;
}

export type MatchStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Match {
  id: number;
  title: string;
  match_type: 'SINGLES' | 'DOUBLES';
  match_date: string;
  player_position: string;
  opponent_name?: string;
  notes?: string;
  status: MatchStatus;
  analysis_progress: number;
  status_message: string;
  is_public_shared?: boolean;
  share_token?: string;
  created_at: string;
  video?: UploadedVideo;
  calibration?: CourtCalibration;
  analytics?: MatchAnalytics;
  recommendations: PerformanceRecommendation[];
  reports: GeneratedReport[];
}

export interface ShareMatchResult {
  match_id: number;
  is_public_shared: boolean;
  share_token?: string;
  share_url?: string;
}

export interface SharedMatchPublic {
  id: number;
  title: string;
  match_type: 'SINGLES' | 'DOUBLES';
  match_date: string;
  player_position: string;
  opponent_name?: string;
  notes?: string;
  status: MatchStatus;
  player_name: string;
  created_at: string;
  analytics?: MatchAnalytics;
  recommendations: PerformanceRecommendation[];
  shot_events: ShotEvent[];
  rally_events: RallyEvent[];
  movement_tracks: Array<{
    player_id: number;
    timestamp: number;
    court_x_m: number;
    court_y_m: number;
    instant_speed_kmh: number;
    court_zone: string;
    is_base_position: boolean;
  }>;
  has_pdf_report: boolean;
}

export interface MovementTrackPoint {
  timestamp: number;
  player_id: number;
  court_x_m: number;
  court_y_m: number;
  speed_kmh: number;
  zone: string;
  is_base: boolean;
}

export interface ShuttlecockDetectionPoint {
  timestamp: number;
  court_x_m?: number;
  court_y_m?: number;
  speed_kmh?: number;
  speed_confidence: string;
  is_hit: boolean;
}

export interface AnalysisResults {
  match_id: number;
  status: MatchStatus;
  shots: ShotEvent[];
  rallies: RallyEvent[];
  movement_tracks: MovementTrackPoint[];
  shuttlecock_detections: ShuttlecockDetectionPoint[];
}

export interface DashboardSummary {
  total_matches_analyzed: number;
  total_playing_time_sec: number;
  avg_rally_duration_sec: number;
  total_detected_shots: number;
  total_movement_distance_m: number;
  avg_movement_speed_kmh: number;
  recent_matches: Match[];
  performance_trends: Array<{
    match_id: number;
    title: string;
    date: string;
    distance_m: number;
    avg_speed_kmh: number;
    max_speed_kmh: number;
    total_shots: number;
    base_recovery_percent: number;
  }>;
}

