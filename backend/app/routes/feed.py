"""WebSocket endpoint: serve annotated video feed (read-only broadcast)."""
import logging
import time

from flask import Blueprint
from flask_sock import Sock

from app.routes.stream import get_latest_frame

logger = logging.getLogger(__name__)
feed_bp = Blueprint("feed", __name__)
sock = Sock()


@feed_bp.record_once
def _init_sock(state):
    """Initialize flask-sock on the app."""
    sock.init_app(state.app)


@sock.route("/ws/feed", bp=feed_bp)
def video_feed(ws):
    """
    Read-only WebSocket that broadcasts the latest annotated frame.

    Clients connect and receive a continuous stream of annotated JPEG frames
    from the shared frame buffer populated by /ws/stream.
    """
    logger.info("📺 Client connected to /ws/feed")
    last_frame = object()  # Use a dummy object so first iteration sends correctly

    try:
        while True:
            frame, frame_time = get_latest_frame()

            # If the frame is explicitly None, or if we haven't received a frame in 1.5 seconds
            if frame is None or (time.time() - frame_time > 1.5):
                if last_frame is not None:
                    ws.send("OFFLINE")
                    last_frame = None
            else:
                if frame is not last_frame:
                    ws.send(frame)
                    last_frame = frame

            # Throttle to ~30fps max
            time.sleep(0.033)

    except Exception as e:
        logger.error(f"Feed WebSocket error: {e}")
    finally:
        logger.info("🔌 Client disconnected from /ws/feed")
