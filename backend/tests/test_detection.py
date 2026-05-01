"""Smoke test: MediaPipe detection returns bounding box on a test image."""
import io
from PIL import Image, ImageDraw


def _create_test_face_image():
    """
    Create a simple synthetic image that MediaPipe can attempt to detect on.
    For a real smoke test, place a real face image in tests/fixtures/test_face.jpg.
    """
    img = Image.new("RGB", (200, 200), color=(200, 180, 160))
    draw = ImageDraw.Draw(img)
    # Draw a rough face shape
    draw.ellipse([50, 30, 150, 170], fill=(220, 190, 170))
    # Eyes
    draw.ellipse([70, 70, 90, 85], fill=(50, 50, 50))
    draw.ellipse([110, 70, 130, 85], fill=(50, 50, 50))
    # Mouth
    draw.arc([80, 100, 120, 140], start=0, end=180, fill=(150, 80, 80), width=2)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_detect_face_returns_dict():
    """detection.detect_face should return a dict with expected keys."""
    from app.services.detection import detect_face

    image_bytes = _create_test_face_image()
    result = detect_face(image_bytes)

    # Result should not be None (decode succeeded)
    assert result is not None
    assert isinstance(result, dict)

    # Should have all expected keys
    expected_keys = {"x", "y", "width", "height", "confidence", "face_detected"}
    assert expected_keys.issubset(result.keys())


def test_detect_face_with_invalid_bytes():
    """detection.detect_face should return None for invalid image data."""
    from app.services.detection import detect_face

    result = detect_face(b"not_an_image")
    assert result is None


def test_detect_face_confidence_type():
    """Confidence should be a float."""
    from app.services.detection import detect_face

    image_bytes = _create_test_face_image()
    result = detect_face(image_bytes)

    if result and result["face_detected"]:
        assert isinstance(result["confidence"], float)
        assert 0.0 <= result["confidence"] <= 1.0
