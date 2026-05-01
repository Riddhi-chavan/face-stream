import uuid
from datetime import datetime, timezone

from app.extensions import db


class ROIEvent(db.Model):
    """Stores face detection bounding box (ROI) data for each processed frame."""

    __tablename__ = "roi_events"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    frame_id = db.Column(
        db.String(36),
        nullable=False,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    timestamp = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    x = db.Column(db.Integer, nullable=False, default=0)
    y = db.Column(db.Integer, nullable=False, default=0)
    width = db.Column(db.Integer, nullable=False, default=0)
    height = db.Column(db.Integer, nullable=False, default=0)
    confidence = db.Column(db.Float, nullable=False, default=0.0)
    face_detected = db.Column(db.Boolean, nullable=False, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "frame_id": self.frame_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "confidence": self.confidence,
            "face_detected": self.face_detected,
        }

    def __repr__(self):
        return f"<ROIEvent frame={self.frame_id} face={self.face_detected}>"
