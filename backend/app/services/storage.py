"""ROI data persistence service."""
import logging
import uuid
from datetime import datetime, timezone

from app.extensions import db
from app.models.roi import ROIEvent

logger = logging.getLogger(__name__)


def save_roi(bbox: dict, frame_id: str | None = None, timestamp: datetime | None = None) -> ROIEvent | None:
    """
    Save a face detection ROI event to the database.

    Args:
        bbox: Dict with keys {x, y, width, height, confidence, face_detected}.
        frame_id: Optional UUID string for the frame. Generated if not provided.
        timestamp: Optional timestamp. Uses current UTC time if not provided.

    Returns:
        The created ROIEvent instance, or None if an error occurred.
    """
    if frame_id is None:
        frame_id = str(uuid.uuid4())
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)

    try:
        event = ROIEvent(
            frame_id=frame_id,
            timestamp=timestamp,
            x=bbox.get("x", 0),
            y=bbox.get("y", 0),
            width=bbox.get("width", 0),
            height=bbox.get("height", 0),
            confidence=bbox.get("confidence", 0.0),
            face_detected=bbox.get("face_detected", False),
        )
        db.session.add(event)
        db.session.commit()
        return event
    except Exception as e:
        logger.error(f"Failed to save ROI event: {e}")
        db.session.rollback()
        return None
