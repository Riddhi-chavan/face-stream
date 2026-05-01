"""REST endpoint: serve ROI data from PostgreSQL."""
from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models.roi import ROIEvent

roi_bp = Blueprint("roi", __name__)


@roi_bp.route("/api/roi", methods=["GET"])
def get_roi_events():
    """
    Get paginated ROI event data.

    Query params:
        limit  — max results to return (default 50, max 100)
        offset — number of results to skip (default 0)

    Returns:
        JSON with {total, results} where results is a list of ROI events.
    """
    # Parse and validate query params
    try:
        limit = int(request.args.get("limit", 50))
    except (ValueError, TypeError):
        limit = 50
    limit = max(1, min(limit, 100))  # clamp to [1, 100]

    try:
        offset = int(request.args.get("offset", 0))
    except (ValueError, TypeError):
        offset = 0
    offset = max(0, offset)

    # Query database
    total = db.session.query(ROIEvent).count()
    events = (
        db.session.query(ROIEvent)
        .order_by(ROIEvent.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return jsonify({
        "total": total,
        "limit": limit,
        "offset": offset,
        "results": [event.to_dict() for event in events],
    })
