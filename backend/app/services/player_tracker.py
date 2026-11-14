import cv2
import numpy as np
from typing import List, Dict, Any, Tuple
from app.services.court_detector import CourtDetector

class PlayerTracker:
    """
    Computer vision pipeline for player detection and persistent tracking.
    Uses motion cues, background subtraction, color clustering, and bounding box tracking.
    Projects bottom-center foot coordinates through Homography H into real-world meters.
    """

    def __init__(self, homography_matrix: np.ndarray, court_type: str = "SINGLES", fps: float = 30.0):
        self.H = homography_matrix
        self.court_type = court_type
        self.fps = fps if fps > 0 else 30.0
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=36, detectShadows=True)
        self.tracked_players: Dict[int, Dict[str, Any]] = {}
        self.last_known_positions: Dict[int, Dict[str, Any]] = {}

    def process_frame(
        self, 
        frame: np.ndarray, 
        frame_idx: int, 
        timestamp: float
    ) -> List[Dict[str, Any]]:
        """
        Processes a single frame, detects player bounding boxes, anchors feet,
        and computes metric court coordinates.
        """
        h, w = frame.shape[:2]
        fg_mask = self.bg_subtractor.apply(frame)
        
        # Remove shadows and noise
        _, binary = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 9))
        dilated = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        detections = []
        # Support human silhouette detection across smartphone 720p/1080p/4K resolutions
        min_area = max(200.0, (h * w) * 0.0006)
        max_area = (h * w) * 0.35

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area < area < max_area:
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = bh / float(bw)
                # Humans standing, lunging, diving, bending, or stretching
                if 0.55 < aspect_ratio < 4.8:
                    foot_x = x + bw / 2.0
                    foot_y = float(y + bh) # Base of feet
                    
                    # Transform to metric court space
                    court_x, court_y = CourtDetector.transform_pixel_to_court(self.H, foot_x, foot_y)
                    court_zone = CourtDetector.get_court_zone(court_x, court_y, self.court_type)

                    detections.append({
                        "bbox": [x / w, y / h, (x + bw) / w, (y + bh) / h],
                        "foot_px": [foot_x, foot_y],
                        "court_m": [court_x, court_y],
                        "court_zone": court_zone,
                        "confidence": min(0.96, round(0.70 + (area / max_area) * 0.25, 2))
                    })

        # Match detections to player IDs based on court position
        # SINGLES: Player 1 (Near Court), Player 2 (Far Court)
        # DOUBLES: Player 1 & 2 (Near Court Partners), Player 3 & 4 (Far Court Opponents)
        court_w, court_l = CourtDetector.get_standard_court_dimensions(self.court_type)
        mid_court_y = court_l / 2.0

        results = []
        if not detections:
            # If motion drops momentarily (pre-serve stillness or single-frame occlusion),
            # maintain continuity with last known position for up to 1.5 seconds
            for pid, last_det in self.last_known_positions.items():
                if (timestamp - last_det["timestamp"]) <= 1.5:
                    decayed_track = {
                        "player_id": pid,
                        "frame_index": frame_idx,
                        "timestamp": timestamp,
                        "bbox": last_det["bbox"],
                        "foot_px": last_det["foot_px"],
                        "court_x_m": last_det["court_x_m"],
                        "court_y_m": last_det["court_y_m"],
                        "instant_speed_mps": 0.0,
                        "instant_speed_kmh": 0.0,
                        "court_zone": last_det["court_zone"],
                        "is_base_position": last_det.get("is_base_position", True),
                        "confidence": round(max(0.40, last_det["confidence"] * 0.9), 2)
                    }
                    results.append(decayed_track)
            return results

        # Sort detections by Y coordinate (far to near)
        detections.sort(key=lambda d: d["court_m"][1])

        near_candidates = [d for d in detections if d["court_m"][1] >= mid_court_y * 0.65]
        far_candidates = [d for d in detections if d["court_m"][1] < mid_court_y * 1.35]

        # Auto-detect doubles if explicit setting is DOUBLES or if 3-4 players are visible on court
        is_doubles_mode = (self.court_type == "DOUBLES") or (
            len(near_candidates) >= 2 or len(far_candidates) >= 2 or len(detections) >= 3
        )

        if is_doubles_mode:
            # --- DOUBLES MODE (WHOLE COURT: 4 PLAYERS) ---
            # Near Court (Player 1 & Player 2 Partners)
            if near_candidates:
                sorted_near = sorted(near_candidates, key=lambda d: d["confidence"], reverse=True)
                p1_cand = sorted_near[0]
                p1_track = self._format_player_track(1, p1_cand, frame_idx, timestamp)
                results.append(p1_track)
                self.last_known_positions[1] = p1_track

                if len(sorted_near) > 1:
                    for cand in sorted_near[1:]:
                        dx = cand["court_m"][0] - p1_cand["court_m"][0]
                        dy = cand["court_m"][1] - p1_cand["court_m"][1]
                        if np.hypot(dx, dy) >= 0.5:
                            p2_track = self._format_player_track(2, cand, frame_idx, timestamp)
                            results.append(p2_track)
                            self.last_known_positions[2] = p2_track
                            break
            elif detections:
                best_near = max(detections, key=lambda d: d["court_m"][1])
                p1_track = self._format_player_track(1, best_near, frame_idx, timestamp)
                results.append(p1_track)
                self.last_known_positions[1] = p1_track

            # Far Court (Player 3 & Player 4)
            if far_candidates:
                near_foots = [r["foot_px"] for r in results]
                valid_far = [d for d in far_candidates if d["foot_px"] not in near_foots]
                if valid_far:
                    sorted_far = sorted(valid_far, key=lambda d: d["confidence"], reverse=True)
                    p3_cand = sorted_far[0]
                    p3_track = self._format_player_track(3, p3_cand, frame_idx, timestamp)
                    results.append(p3_track)
                    self.last_known_positions[3] = p3_track

                    if len(sorted_far) > 1:
                        for cand in sorted_far[1:]:
                            dx = cand["court_m"][0] - p3_cand["court_m"][0]
                            dy = cand["court_m"][1] - p3_cand["court_m"][1]
                            if np.hypot(dx, dy) >= 0.5:
                                p4_track = self._format_player_track(4, cand, frame_idx, timestamp)
                                results.append(p4_track)
                                self.last_known_positions[4] = p4_track
                                break
        else:
            # --- SINGLES MODE (2 PLAYERS) ---
            if near_candidates:
                # Pick largest/highest confidence near player
                best_near = max(near_candidates, key=lambda d: d["confidence"])
                p1_track = self._format_player_track(1, best_near, frame_idx, timestamp)
                results.append(p1_track)
                self.last_known_positions[1] = p1_track
            elif detections:
                # Fallback when near player lunges forward towards net
                best_near = max(detections, key=lambda d: d["court_m"][1])
                p1_track = self._format_player_track(1, best_near, frame_idx, timestamp)
                results.append(p1_track)
                self.last_known_positions[1] = p1_track

            if far_candidates:
                # Pick far player candidate distinct from player 1
                valid_far = [d for d in far_candidates if not results or d["foot_px"] != results[0]["foot_px"]]
                if valid_far:
                    best_far = max(valid_far, key=lambda d: d["confidence"])
                    p2_track = self._format_player_track(2, best_far, frame_idx, timestamp)
                    results.append(p2_track)
                    self.last_known_positions[2] = p2_track

        return results

    def _format_player_track(
        self, 
        player_id: int, 
        det: Dict[str, Any], 
        frame_idx: int, 
        timestamp: float
    ) -> Dict[str, Any]:
        court_x, court_y = det["court_m"]
        
        # Calculate instantaneous speed from previous position
        speed_mps = 0.0
        prev = self.tracked_players.get(player_id)
        if prev and (timestamp - prev["timestamp"]) > 0:
            dt = timestamp - prev["timestamp"]
            dx = court_x - prev["court_x"]
            dy = court_y - prev["court_y"]
            dist = np.sqrt(dx * dx + dy * dy)
            # Physical human limit filtering (sprint max ~10 m/s)
            raw_speed = dist / dt
            if raw_speed < 11.0:
                # Exponential smoothing
                speed_mps = round(0.7 * raw_speed + 0.3 * prev["speed_mps"], 2)
            else:
                speed_mps = prev["speed_mps"]

        speed_kmh = round(speed_mps * 3.6, 2)

        # Base position detection: within center zone around (mid_x, 9.5m for near court)
        court_w, court_l = CourtDetector.get_standard_court_dimensions(self.court_type)
        is_near = player_id == 1 or (self.court_type == "DOUBLES" and player_id == 2)
        base_center_y = court_l * 0.72 if is_near else court_l * 0.28
        base_center_x = court_w * 0.5
        dist_to_base = np.sqrt((court_x - base_center_x)**2 + (court_y - base_center_y)**2)
        is_base = bool(dist_to_base <= 1.6)

        self.tracked_players[player_id] = {
            "court_x": court_x,
            "court_y": court_y,
            "timestamp": timestamp,
            "speed_mps": speed_mps
        }

        return {
            "player_id": player_id,
            "frame_index": frame_idx,
            "timestamp": timestamp,
            "bbox": det["bbox"],
            "foot_px": det["foot_px"],
            "court_x_m": court_x,
            "court_y_m": court_y,
            "instant_speed_mps": speed_mps,
            "instant_speed_kmh": speed_kmh,
            "court_zone": det["court_zone"],
            "is_base_position": is_base,
            "confidence": det["confidence"]
        }

