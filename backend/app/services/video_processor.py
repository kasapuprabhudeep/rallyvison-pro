import os
import cv2
from pathlib import Path
from typing import Dict, Any, Tuple
from app.core.config import FRAMES_DIR, THUMBNAILS_DIR

class VideoProcessor:
    @staticmethod
    def extract_metadata(file_path: str) -> Dict[str, Any]:
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video file at {file_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = float(frame_count / fps) if fps > 0 else 0.0

        fourcc_int = int(cap.get(cv2.CAP_PROP_FOURCC))
        codec = "".join([chr((fourcc_int >> 8 * i) & 0xFF) for i in range(4)]).strip()
        cap.release()

        return {
            "fps": round(fps, 2),
            "frame_count": frame_count,
            "width": width,
            "height": height,
            "duration_seconds": round(duration, 2),
            "codec": codec or "h264"
        }

    @staticmethod
    def generate_thumbnail(file_path: str, match_id: int) -> str:
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            return ""
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        target_frame = min(int(total_frames * 0.1), total_frames - 1)
        cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, target_frame))
        
        success, frame = cap.read()
        cap.release()
        
        if not success or frame is None:
            return ""
        
        thumb_name = f"thumb_match_{match_id}.jpg"
        thumb_path = THUMBNAILS_DIR / thumb_name
        
        # Resize thumbnail to standard 720p or lower for quick web loading
        h, w = frame.shape[:2]
        new_w = min(640, w)
        new_h = int(h * (new_w / w))
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(thumb_path), resized)
        
        return f"/storage/thumbnails/{thumb_name}"

    @staticmethod
    def extract_key_frame(file_path: str, match_id: int, frame_idx: int = 15) -> Tuple[str, str]:
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            return "", ""
        
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        success, frame = cap.read()
        cap.release()
        
        if not success or frame is None:
            return "", ""
        
        frame_name = f"court_frame_match_{match_id}.jpg"
        frame_path = FRAMES_DIR / frame_name
        cv2.imwrite(str(frame_path), frame)
        
        return str(frame_path), f"/storage/frames/{frame_name}"

    @staticmethod
    def ensure_web_compatible(file_path: str) -> str:
        """
        Ensures the video is encoded with web-playable H.264 (AVC1) + faststart.
        If it's already web-playable (avc1/h264/vp8/vp9), returns original path.
        Otherwise, automatically transcodes to browser-playable H.264 MP4.
        """
        try:
            import imageio_ffmpeg
            import subprocess
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            
            p = Path(file_path)
            meta = VideoProcessor.extract_metadata(file_path)
            codec = meta.get("codec", "").lower()
            
            # If codec is already h264 / avc1 / vp8 / vp9, no need to transcode
            if codec in ["h264", "avc1", "vp80", "vp90", "vp8", "vp9"] and p.suffix.lower() in [".mp4", ".webm"]:
                return file_path
            
            # Transcode to standard H.264 MP4 with faststart (moov atom at start for instant streaming)
            target_path = str(p.with_name(f"{p.stem}_web.mp4"))
            cmd = [
                ffmpeg_exe, "-y",
                "-i", file_path,
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                target_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            if os.path.exists(target_path) and os.path.getsize(target_path) > 0:
                os.remove(file_path)
                os.replace(target_path, file_path)
                return file_path
        except Exception:
            pass
        return file_path

