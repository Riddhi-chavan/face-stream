"""Pytest configuration and fixtures."""
import pytest
from app import create_app
from app.extensions import db as _db


@pytest.fixture(scope="session")
def app():
    """Create application for testing."""
    app = create_app("testing")
    return app


@pytest.fixture(scope="session")
def client(app):
    """Create a test client."""
    return app.test_client()


@pytest.fixture(scope="function")
def db(app):
    """Create database tables for tests, then drop them after."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        _db.drop_all()
