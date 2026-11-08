import numpy as np
from typing import List, Dict, Any, Tuple

class MovementAnalyzer:
    """
    Computes rigorous physical analytics from calibrated player tracking coordinates.
    Only computes metric distances when a valid homography calibration exists.
    """

    @classmethod
    def analyze_movement(
        cls,
        player_tracks: List[Dict[str, Any]],
        court_calibrated: bool = True
    ) -> Dict[str, Any]:
        if not player_tracks or not court_calibrated:
            return {
                "total_movement_distance_m": 0.0,
                "avg_movement_speed_kmh": 0.0,
                "max_movement_speed_kmh": 0.0,
                "base_recovery_rate_percent": 0.0,
                "court_zone_occupancy": {
                    "FRONT_LEFT": 0.0,
                    "FRONT_RIGHT": 0.0,
                    "MID_LEFT": 0.0,
                    "MID_RIGHT": 0.0,
                    "REAR_LEFT": 0.0,
                    "REAR_RIGHT": 0.0
                },
                "speed_series": []
            }

        # Filter tracks for target player (e.g. Player 1 near court)
        p1_tracks = [t for t in player_tracks if t.get("player_id", 1) == 1]
        if not p1_tracks:
            p1_tracks = player_tracks

        total_distance = 0.0
        speeds_kmh = []
        speed_series = []
        base_count = 0
        zone_counts = {
            "FRONT_LEFT": 0,
            "FRONT_RIGHT": 0,
            "MID_LEFT": 0,
            "MID_RIGHT": 0,
            "REAR_LEFT": 0,
            "REAR_RIGHT": 0
        }

        for i in range(len(p1_tracks)):
            curr = p1_tracks[i]
            speeds_kmh.append(curr.get("instant_speed_kmh", 0.0))
            
            # Sampling speed series for frontend charts (1 point per second approximately)
            if i % 3 == 0 or i == len(p1_tracks) - 1:
                speed_series.append({
                    "time": round(float(curr.get("timestamp", 0.0)), 1),
                    "speed": round(float(curr.get("instant_speed_kmh", 0.0)), 2),
                    "zone": curr.get("court_zone", "MID_RIGHT")
                })

            if curr.get("is_base_position", False):
                base_count += 1

            zone = curr.get("court_zone")
            if zone in zone_counts:
                zone_counts[zone] += 1

            if i > 0:
                prev = p1_tracks[i - 1]
                dx = curr["court_x_m"] - prev["court_x_m"]
                dy = curr["court_y_m"] - prev["court_y_m"]
                step_dist = np.sqrt(dx * dx + dy * dy)
                # Realistic limit check per step to avoid outlier teleportation
                if step_dist < 4.0:
                    total_distance += step_dist

        total_points = len(p1_tracks)
        zone_percentages = {}
        for z, c in zone_counts.items():
            zone_percentages[z] = round((c / total_points) * 100.0, 1) if total_points > 0 else 0.0

        avg_speed = round(float(np.mean(speeds_kmh)), 2) if speeds_kmh else 0.0
        max_speed = round(float(np.max(speeds_kmh)), 2) if speeds_kmh else 0.0
        base_rate = round((base_count / total_points) * 100.0, 1) if total_points > 0 else 0.0

        # Everyday / Fitness & Gamified Analytics
        steps = int(round(total_distance / 0.72))
        duration_hrs = (total_points / 15.0) / 3600.0 if total_points > 0 else 0.0
        calories = int(round(7.0 * 70.0 * duration_hrs + (total_distance * 0.065)))
        if total_distance > 0 and calories == 0:
            calories = 1
        energy_score = min(98, max(45, int(45 + avg_speed * 4.2 + (base_rate * 0.22))))

        rear_pct = zone_percentages.get("REAR_LEFT", 0) + zone_percentages.get("REAR_RIGHT", 0)
        front_pct = zone_percentages.get("FRONT_LEFT", 0) + zone_percentages.get("FRONT_RIGHT", 0)

        if total_distance > 650:
            archetype = "The Court Marathoner 🏃"
        elif front_pct > 38:
            archetype = "The Net Ninja 🎯"
        elif rear_pct > 50:
            archetype = "Baseline Guardian 🛡️"
        elif avg_speed > 7.5:
            archetype = "Lightning Cheetah ⚡"
        else:
            archetype = "All-Round Dynamo 🏸"

        return {
            "total_movement_distance_m": round(float(total_distance), 1),
            "avg_movement_speed_kmh": avg_speed,
            "max_movement_speed_kmh": max_speed,
            "base_recovery_rate_percent": base_rate,
            "court_zone_occupancy": zone_percentages,
            "speed_series": speed_series,
            "estimated_calories_burned": calories,
            "estimated_steps": steps,
            "match_energy_score": energy_score,
            "player_archetype": archetype
        }

