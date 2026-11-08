from typing import List, Dict, Any

class RecommendationEngine:
    """
    Grounded tactical coaching recommendation generator.
    Translates empirical match analytics into actionable training drills and tactical advice.
    Does not speculate on player anatomy or unmeasured traits.
    """

    @classmethod
    def generate_recommendations(
        cls,
        analytics: Dict[str, Any],
        shot_distribution: Dict[str, int],
        total_shots: int
    ) -> List[Dict[str, Any]]:
        recs = []

        base_rate = analytics.get("base_recovery_rate_percent", 0.0)
        avg_speed = analytics.get("avg_movement_speed_kmh", 0.0)
        max_speed = analytics.get("max_movement_speed_kmh", 0.0)
        work_to_rest = analytics.get("work_to_rest_ratio", 0.0)
        zone_occupancy = analytics.get("court_zone_occupancy", {})

        # 1. Base Position Recovery
        if base_rate < 40.0:
            recs.append({
                "category": "POSITIONING",
                "title": "Enhance Central Base Recovery After Lunges",
                "observation": f"Base recovery was detected at {base_rate}% of active frames, indicating delayed return to the center T-junction after defensive or corner hits.",
                "recommendation": "Integrate 6-corner shadow badminton drills with an immediate explosive push-back to the central T-mark between every shot cycle.",
                "priority": "HIGH",
                "grounded_metric": f"Base recovery: {base_rate}% (Target > 55%)"
            })
        else:
            recs.append({
                "category": "POSITIONING",
                "title": "Maintain High Base Discipline",
                "observation": f"Base recovery consistency reached {base_rate}%, demonstrating solid spatial awareness and center reset.",
                "recommendation": "Continue split-step initiation just as opponent prepares racket swing to maintain proactive anticipation.",
                "priority": "LOW",
                "grounded_metric": f"Base recovery: {base_rate}%"
            })

        # 2. Court Zone Imbalance
        front_time = zone_occupancy.get("FRONT_LEFT", 0) + zone_occupancy.get("FRONT_RIGHT", 0)
        rear_time = zone_occupancy.get("REAR_LEFT", 0) + zone_occupancy.get("REAR_RIGHT", 0)
        
        if rear_time > 55.0:
            recs.append({
                "category": "TACTICAL",
                "title": "Counter Excessive Deep Baseline Pinning",
                "observation": f"55%+ of match time was spent deep in the rear court ({rear_time:.1f}%), suggesting difficulty resetting rallies when under baseline pressure.",
                "recommendation": "Incorporate attacking fast drops and half-smashes instead of high clears when caught behind the shuttle to reclaim offensive initiative.",
                "priority": "HIGH",
                "grounded_metric": f"Rear court time: {rear_time:.1f}%"
            })
        elif front_time > 45.0:
            recs.append({
                "category": "TACTICAL",
                "title": "Guard Against Rear Court Over-Commitment",
                "observation": f"Extended time spent at the net ({front_time:.1f}%) leaves the rear corners vulnerable to flick clears and high lifts.",
                "recommendation": "Practice fast scissor-kick backwards footwork transitions to intercept overhead clears quickly.",
                "priority": "MEDIUM",
                "grounded_metric": f"Front court time: {front_time:.1f}%"
            })

        # 3. Shot Arsenal Diversification
        smashes = shot_distribution.get("SMASH", 0)
        clears = shot_distribution.get("CLEAR", 0)
        drops = shot_distribution.get("DROP", 0)
        net_shots = shot_distribution.get("NET_SHOT", 0)

        if total_shots >= 10:
            smash_ratio = (smashes / total_shots) * 100.0
            if smash_ratio < 12.0:
                recs.append({
                    "category": "SHOT_SELECTION",
                    "title": "Increase Steep Attacking Pressure (Smashes & Slices)",
                    "observation": f"Smash attempts comprised only {smash_ratio:.1f}% of total detected shots ({smashes}/{total_shots}).",
                    "recommendation": "When receiving short lifts into the mid-court, execute aggressive steep jump smashes aimed down the tramlines or straight at opponent's hip/torso.",
                    "priority": "MEDIUM",
                    "grounded_metric": f"Smash frequency: {smash_ratio:.1f}%"
                })
            elif smash_ratio > 35.0:
                recs.append({
                    "category": "SHOT_SELECTION",
                    "title": "Mix Deceptive Drops With Power Smashes",
                    "observation": f"High smash volume ({smash_ratio:.1f}%) can lead to physical fatigue and predictable counter-defense.",
                    "recommendation": "Disguise fast slice drop shots with the same preparation swing as a full smash to keep defensive blocks off-balance.",
                    "priority": "MEDIUM",
                    "grounded_metric": f"Smash frequency: {smash_ratio:.1f}%"
                })

        # 4. Movement Efficiency & Footwork
        if max_speed > 0 and avg_speed > 0:
            burst_ratio = max_speed / max(0.1, avg_speed)
            if burst_ratio < 2.0:
                recs.append({
                    "category": "FOOTWORK",
                    "title": "Develop Explosive First-Step Acceleration",
                    "observation": f"Speed profile reflects steady pacing ({avg_speed:.1f} km/h avg vs {max_speed:.1f} km/h peak) without sharp decelerations/accelerations.",
                    "recommendation": "Incorporate agility ladder drill intervals and weighted resistance band lunges to improve sudden change-of-direction burst speed.",
                    "priority": "MEDIUM",
                    "grounded_metric": f"Peak/Avg speed ratio: {burst_ratio:.1f}x"
                })

        return recs

