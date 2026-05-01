import os
from flask import Flask
from flask_cors import CORS

from app.config import config_map
from app.extensions import db, migrate


def create_app(config_name=None):
    """Flask application factory."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map["development"]))

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # CORS — restrict to frontend origin
    CORS(app, origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173"]))

    # Import models so Alembic can detect them
    from app.models import roi  # noqa: F401

    # Register blueprints / routes
    from app.routes.stream import stream_bp
    from app.routes.feed import feed_bp
    from app.routes.roi import roi_bp

    app.register_blueprint(stream_bp)
    app.register_blueprint(feed_bp)
    app.register_blueprint(roi_bp)

    # Health check endpoint
    @app.route("/health")
    def health():
        return {"status": "ok"}, 200

    return app
