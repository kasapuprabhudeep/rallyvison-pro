from typing import Dict, Any, Optional
from app.models.entities import ShotType

class ShotClassifier:
    """
    Shot detection and classification module.
    Analyzes hitting event geometry, court positioning, trajectory height, and velocity.
    Categorizes into CLEAR, DROP, SMASH, DRIVE, NET_SHOT, LIFT, DEFENSIVE, or UNKNOWN.
    """

    @classmethod
    def classify_shot_event(
        cls,
        hit_timestamp: float,
        player_track: Optional[Dict[str, Any]],
        shuttle_data: Optional[Dict[str, Any]],
        speed_kmh: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Classifies shot based on player position on court, shuttle position, and movement dynamic.
        """
        if not player_track:
            return {
                "timestamp": hit_timestamp,
                "shot_type": ShotType.UNKNOWN,
                "confidence": 0.30,
                "hitting_player_id": 1,
                "court_x_m": None,
                "court_y_m": None
            }

        court_x = player_track.get("court_x_m", 2.6)
        court_y = player_track.get("court_y_m", 9.0)
        zone = player_track.get("court_zone", "MID_RIGHT")
        player_id = player_track.get("player_id", 1)

        # Badminton Court Dimensions reference:
        # Near court player:
        # Net area: 6.7m (center net line)
        # Front zone: y between 6.0m and 8.0m
        # Mid zone: y between 8.0m and 11.0m
        # Rear zone: y > 11.0m (back baseline)
        
        # Far court player:
        # Front zone: y between 5.4m and 6.7m
        # Rear zone: y < 2.5m

        # Check zone
        is_rear_court = "REAR" in zone or court_y > 10.8 or court_y < 2.5
        is_front_court = "FRONT" in zone or (5.5 <= court_y <= 7.8)
        is_mid_court = "MID" in zone or (7.8 < court_y <= 10.8)

        shot_type = ShotType.UNKNOWN
        confidence = 0.50

        effective_speed = speed_kmh if speed_kmh is not None else 100.0

        if is_rear_court:
            # Overhead shots from back of court: Smash, Clear, or Drop
            if effective_speed > 160.0:
                shot_type = ShotType.SMASH
                confidence = 0.88
            elif 85.0 <= effective_speed <= 160.0:
                shot_type = ShotType.CLEAR
                confidence = 0.84
            else:
                shot_type = ShotType.DROP
                confidence = 0.78
        elif is_front_court:
            # Front of court net play: Net shot or Lift
            if effective_speed < 70.0:
                shot_type = ShotType.NET_SHOT
                confidence = 0.82
            else:
                shot_type = ShotType.LIFT
                confidence = 0.80
        elif is_mid_court:
            # Mid court play: Drive or Defensive block
            if effective_speed > 110.0:
                shot_type = ShotType.DRIVE
                confidence = 0.82
            else:
                shot_type = ShotType.DEFENSIVE
                confidence = 0.75
        else:
            shot_type = ShotType.UNKNOWN
            confidence = 0.40

        return {
            "timestamp": round(hit_timestamp, 2),
            "shot_type": shot_type,
            "confidence": confidence,
            "hitting_player_id": player_id,
            "court_x_m": court_x,
            "court_y_m": court_y,
            "is_user_corrected": False
        }

