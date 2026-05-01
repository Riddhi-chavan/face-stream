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
    last_frame = None

    try:
        while True:
            frame = get_latest_frame()

            if frame is not None and frame is not last_frame:
                ws.send(frame)
                last_frame = frame

            # Throttle to ~30fps max
            time.sleep(0.033)

    except Exception as e:
        logger.error(f"Feed WebSocket error: {e}")
    finally:
        logger.info("🔌 Client disconnected from /ws/feed")
