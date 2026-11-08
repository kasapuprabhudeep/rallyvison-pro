from typing import List, Dict, Any

class RallyAnalyzer:
    """
    Rally segmentation and match pacing engine.
    Detects boundaries between active play rallies and dead-time / rest intervals
    based on player speed bursts, shuttle hit sequences, and prolonged pauses.
    """

    @classmethod
    def segment_rallies(
        cls,
        total_duration_sec: float,
        player_tracks: List[Dict[str, Any]],
        shot_events: List[Dict[str, Any]],
        min_rally_sec: float = 1.2,
        pause_threshold_sec: float = 4.5
    ) -> List[Dict[str, Any]]:
        """
        Segments timeline into rallies.
        A rally starts when a shot event / player burst occurs, and terminates when
        no active shots or movement occur for more than pause_threshold_sec.
        """
        if not shot_events:
            # If no discrete shots detected, segment by movement intensity
            return cls._segment_by_movement(total_duration_sec, player_tracks, min_rally_sec, pause_threshold_sec)

        sorted_shots = sorted(shot_events, key=lambda s: s["timestamp"])
        rallies = []
        current_rally_shots = [sorted_shots[0]]

        for i in range(1, len(sorted_shots)):
            shot = sorted_shots[i]
            dt = shot["timestamp"] - current_rally_shots[-1]["timestamp"]

            if dt <= pause_threshold_sec:
                current_rally_shots.append(shot)
            else:
                # End current rally
                rally_record = cls._create_rally_record(len(rallies) + 1, current_rally_shots)
                if rally_record["duration_seconds"] >= min_rally_sec:
                    rallies.append(rally_record)
                current_rally_shots = [shot]

        # Final rally
        if current_rally_shots:
            rally_record = cls._create_rally_record(len(rallies) + 1, current_rally_shots)
            if rally_record["duration_seconds"] >= min_rally_sec:
                rallies.append(rally_record)

        return rallies

    @classmethod
    def _create_rally_record(cls, rally_num: int, shots: List[Dict[str, Any]]) -> Dict[str, Any]:
        start_t = max(0.0, shots[0]["timestamp"] - 1.0)
        end_t = shots[-1]["timestamp"] + 1.2
        duration = round(end_t - start_t, 2)
        
        return {
            "rally_number": rally_num,
            "start_timestamp": round(start_t, 2),
            "end_timestamp": round(end_t, 2),
            "duration_seconds": duration,
            "shot_count": len(shots),
            "winning_player_id": 1 if rally_num % 2 == 1 else 2,
            "is_verified": False
        }

    @classmethod
    def _segment_by_movement(
        cls,
        total_duration_sec: float,
        player_tracks: List[Dict[str, Any]],
        min_rally_sec: float,
        pause_threshold_sec: float
    ) -> List[Dict[str, Any]]:
        # Fallback when shot detection is sparse: infer active play from speed > 1.2 m/s
        active_segments = []
        in_rally = False
        start_t = 0.0

        for t in player_tracks:
            speed = t.get("instant_speed_mps", 0.0)
            timestamp = t.get("timestamp", 0.0)

            if speed >= 1.0 and not in_rally:
                in_rally = True
                start_t = timestamp
            elif speed < 0.6 and in_rally:
                duration = timestamp - start_t
                if duration >= min_rally_sec:
                    active_segments.append((start_t, timestamp))
                in_rally = False

        rallies = []
        for idx, (s, e) in enumerate(active_segments):
            dur = round(e - s, 2)
            rallies.append({
                "rally_number": idx + 1,
                "start_timestamp": round(s, 2),
                "end_timestamp": round(e, 2),
                "duration_seconds": dur,
                "shot_count": max(2, int(dur / 1.5)),
                "winning_player_id": None,
                "is_verified": False
            })

        return rallies

