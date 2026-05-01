"""WebSocket endpoint: receive frames from browser, detect faces, return annotated frames."""
import logging
import uuid
import threading
import time
from datetime import datetime, timezone

from flask import Blueprint, current_app
from flask_sock import Sock

from app.services.detection import detect_face
from app.services.drawing import annotate_frame
from app.services.storage import save_roi

logger = logging.getLogger(__name__)
stream_bp = Blueprint("stream", __name__)
sock = Sock()

# Shared frame buffer for the /ws/feed endpoint to read from
_latest_frame_lock = threading.Lock()
_latest_annotated_frame: bytes | None = None
_latest_frame_time: float = 0.0


def get_latest_frame() -> tuple[bytes | None, float]:
    """Thread-safe getter for the latest annotated frame."""
    with _latest_frame_lock:
        return _latest_annotated_frame, _latest_frame_time


def _set_latest_frame(frame_bytes: bytes | None):
    """Thread-safe setter for the latest annotated frame."""
    global _latest_annotated_frame, _latest_frame_time
    with _latest_frame_lock:
        _latest_annotated_frame = frame_bytes
        _latest_frame_time = time.time() if frame_bytes is not None else 0.0


@stream_bp.record_once
def _init_sock(state):
    """Initialize flask-sock on the app."""
    sock.init_app(state.app)


@sock.route("/ws/stream", bp=stream_bp)
def video_stream(ws):
    """
    Bidirectional WebSocket: receive JPEG frames, process them, send back annotated frames.

    Protocol:
    - Client sends raw JPEG bytes
    - Server responds with annotated JPEG bytes
    """
    logger.info("🎥 Client connected to /ws/stream")
    max_frame_size = current_app.config.get("MAX_FRAME_SIZE", 1 * 1024 * 1024)
    app = current_app._get_current_object()

    try:
        while True:
            # Receive raw JPEG frame from browser
            data = ws.receive()

            if data is None:
                break

            # Convert string data to bytes if needed
            if isinstance(data, str):
                data = data.encode("latin-1")

            # Security: reject oversized frames
            if len(data) > max_frame_size:
                logger.warning(f"Frame too large ({len(data)} bytes), skipping")
                continue

            frame_id = str(uuid.uuid4())
            timestamp = datetime.now(timezone.utc)

            # 1. Detect faces
            bbox = detect_face(data)

            if bbox is None:
                # Decoding error — send back the original frame
                ws.send(data)
                continue

            # 2. Draw bounding box
            annotated_bytes = annotate_frame(data, bbox)

            # 3. Update shared frame buffer for /ws/feed
            _set_latest_frame(annotated_bytes)

            # 4. Save ROI to database (in app context)
            def _save(app, bbox, frame_id, timestamp):
                with app.app_context():
                    save_roi(bbox, frame_id=frame_id, timestamp=timestamp)

            save_thread = threading.Thread(
                target=_save,
                args=(app, bbox, frame_id, timestamp),
            )
            save_thread.start()

            # 5. Send annotated frame back to client
            ws.send(annotated_bytes)

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        _set_latest_frame(None)
        logger.info("🔌 Client disconnected from /ws/stream")
