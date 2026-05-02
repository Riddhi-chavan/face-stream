"""REST endpoint: serve ROI data from PostgreSQL."""
import csv
import io
from flask import Blueprint, request, jsonify, Response

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

@roi_bp.route("/api/roi/export", methods=["GET"])
def export_roi_csv():
    """Export all ROI events as a CSV file."""
    events = db.session.query(ROIEvent).order_by(ROIEvent.timestamp.desc()).all()
    
    # Create an in-memory string buffer
    si = io.StringIO()
    cw = csv.writer(si)
    
    # Write headers
    cw.writerow(["ID", "Timestamp", "X", "Y", "Width", "Height", "Confidence", "Face Detected"])
    
    # Write data
    for event in events:
        cw.writerow([
            event.id,
            event.timestamp.isoformat() if event.timestamp else "",
            event.x,
            event.y,
            event.width,
            event.height,
            event.confidence,
            event.face_detected
        ])
    
    # Create the response
    output = si.getvalue()
    response = Response(output, mimetype="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=roi_detections_export.csv"
    
    return response
