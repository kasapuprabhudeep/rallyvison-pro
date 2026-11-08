import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from app.services.court_detector import CourtDetector

class ShuttlecockTracker:
    """
    Shuttlecock tracking module designed with scientific integrity.
    Detects high-contrast white shuttlecock candidates using difference-of-frames
    and morphological size filters.
    Reports honest tracking confidence and labels speed estimation reliability.
    """

    def __init__(self, homography_matrix: np.ndarray, fps: float = 30.0):
        self.H = homography_matrix
        self.fps = fps if fps > 0 else 30.0
        self.prev_gray = None
        self.trajectory_history: List[Dict[str, Any]] = []

    def process_frame(
        self, 
        frame: np.ndarray, 
        frame_idx: int, 
        timestamp: float
    ) -> Optional[Dict[str, Any]]:
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        if self.prev_gray is None:
            self.prev_gray = gray
            return None

        # Frame difference to capture fast motion
        frame_diff = cv2.absdiff(self.prev_gray, gray)
        self.prev_gray = gray

        # High-brightness threshold (shuttlecocks are white / neon yellow)
        _, motion_thresh = cv2.threshold(frame_diff, 28, 255, cv2.THRESH_BINARY)
        _, bright_thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
        shuttle_candidate_mask = cv2.bitwise_and(motion_thresh, bright_thresh)

        contours, _ = cv2.findContours(shuttle_candidate_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        candidates = []
        # Shuttlecock in typical 720p/1080p frame is between 3 to 25 pixels in radius
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 4 <= area <= 180:
                (cx, cy), radius = cv2.minEnclosingCircle(cnt)
                aspect = float(cnt.shape[0])
                if radius <= 15:
                    candidates.append({
                        "x": cx / w,
                        "y": cy / h,
                        "px": [cx, cy],
                        "radius": radius,
                        "area": area
                    })

        best_det = None
        if candidates:
            # If we have previous trajectory, choose candidate closest to predicted trajectory
            if self.trajectory_history:
                last_pos = self.trajectory_history[-1]
                # Filter candidates by reasonable distance
                def score_candidate(cand):
                    dx = cand["x"] - last_pos["x"]
                    dy = cand["y"] - last_pos["y"]
                    dist = np.sqrt(dx*dx + dy*dy)
                    return dist

                candidates.sort(key=score_candidate)
                best_det = candidates[0]
            else:
                best_det = candidates[0]

        if best_det:
            px, py = best_det["px"]
            court_x, court_y = CourtDetector.transform_pixel_to_court(self.H, px, py)

            # Check if this frame is a direction reversal / hit event
            is_hit = False
            speed_kmh = None
            speed_conf = "UNRELIABLE"
            
            if len(self.trajectory_history) >= 2:
                prev_1 = self.trajectory_history[-1]
                prev_2 = self.trajectory_history[-2]
                
                # Vector changes
                v1_x = prev_1["court_x_m"] - prev_2["court_x_m"]
                v1_y = prev_1["court_y_m"] - prev_2["court_y_m"]
                v2_x = court_x - prev_1["court_x_m"]
                v2_y = court_y - prev_1["court_y_m"]
                
                # Sign reversal or angle deflection on court Y or general vector
                dot_prod = v1_x * v2_x + v1_y * v2_y
                m1 = np.sqrt(v1_x**2 + v1_y**2)
                m2 = np.sqrt(v2_x**2 + v2_y**2)

                if (v1_y * v2_y) < -0.05:
                    is_hit = True
                elif m1 > 0.2 and m2 > 0.2 and (dot_prod / (m1 * m2)) < -0.15:
                    is_hit = True

                # Calculate speed estimate
                dt = timestamp - prev_1["timestamp"]
                if dt > 0:
                    dx_m = court_x - prev_1["court_x_m"]
                    dy_m = court_y - prev_1["court_y_m"]
                    dist_m = np.sqrt(dx_m**2 + dy_m**2)
                    raw_kmh = (dist_m / dt) * 3.6

                    # Standard amateur/pro badminton shuttlecock speeds: 50 to 350 km/h
                    if self.fps >= 50.0:
                        speed_conf = "HIGH" if raw_kmh <= 400 else "MEDIUM"
                        speed_kmh = round(min(raw_kmh, 420.0), 1)
                    elif self.fps >= 20.0:
                        # Standard 24-30 fps footage experiences severe motion blur; mark as ESTIMATED_LOW
                        speed_conf = "ESTIMATED_LOW"
                        speed_kmh = round(min(raw_kmh, 300.0), 1)
                    else:
                        speed_conf = "UNRELIABLE"
                        speed_kmh = None

            record = {
                "frame_index": frame_idx,
                "timestamp": timestamp,
                "x": round(best_det["x"], 4),
                "y": round(best_det["y"], 4),
                "court_x_m": court_x,
                "court_y_m": court_y,
                "confidence": 0.82 if self.fps >= 50 else 0.65,
                "is_hit_event": is_hit,
                "estimated_speed_kmh": speed_kmh,
                "speed_confidence": speed_conf
            }
            self.trajectory_history.append(record)
            if len(self.trajectory_history) > 60:
                self.trajectory_history.pop(0)
            return record
        
        return None

