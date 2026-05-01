"""Face detection service using MediaPipe (no OpenCV)."""
import io
import numpy as np
from PIL import Image
import mediapipe as mp


# Initialize MediaPipe Face Detection once at module level
mp_face_detection = mp.solutions.face_detection
_detector = mp_face_detection.FaceDetection(
    model_selection=0,
    min_detection_confidence=0.5,
)


def detect_face(image_bytes: bytes) -> dict | None:
    """
    Detect faces in a JPEG image.

    Args:
        image_bytes: Raw JPEG bytes.

    Returns:
        A dict with keys {x, y, width, height, confidence, face_detected}
        for the first detected face, or a dict with face_detected=False if
        no face is found. Returns None on decode error.
    """
    try:
        # Decode JPEG bytes to PIL Image, then to numpy array
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_array = np.array(pil_image)
    except Exception:
        return None

    img_height, img_width, _ = image_array.shape

    # Run MediaPipe face detection
    results = _detector.process(image_array)

    if results.detections:
        detection = results.detections[0]  # Take first face
        bbox = detection.location_data.relative_bounding_box

        # Convert relative coordinates to absolute pixel values
        x = int(bbox.xmin * img_width)
        y = int(bbox.ymin * img_height)
        w = int(bbox.width * img_width)
        h = int(bbox.height * img_height)

        # Clamp to image boundaries
        x = max(0, x)
        y = max(0, y)
        w = min(w, img_width - x)
        h = min(h, img_height - y)

        return {
            "x": x,
            "y": y,
            "width": w,
            "height": h,
            "confidence": round(detection.score[0], 4),
            "face_detected": True,
        }

    return {
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0,
        "confidence": 0.0,
        "face_detected": False,
    }
