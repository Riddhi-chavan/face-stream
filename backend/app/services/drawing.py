"""Bounding box drawing service using Pillow (no OpenCV)."""
import io
from PIL import Image, ImageDraw, ImageFont


def draw_roi(pil_image: Image.Image, bbox: dict) -> Image.Image:
    """
    Draw an axis-aligned bounding box (ROI) on the image.

    Args:
        pil_image: A PIL Image in RGB mode.
        bbox: Dict with keys {x, y, width, height, confidence, face_detected}.

    Returns:
        The annotated PIL Image.
    """
    if not bbox or not bbox.get("face_detected"):
        return pil_image

    draw = ImageDraw.Draw(pil_image)

    x = bbox["x"]
    y = bbox["y"]
    w = bbox["width"]
    h = bbox["height"]
    confidence = bbox.get("confidence", 0.0)

    # Draw red bounding box with 3px outline
    rect_coords = [x, y, x + w, y + h]
    draw.rectangle(rect_coords, outline="red", width=3)

    # Draw confidence label above the box
    label = f"Face {confidence:.1%}"
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
    except (IOError, OSError):
        font = ImageFont.load_default()

    # Get text bounding box for background
    text_bbox = draw.textbbox((x, y - 22), label, font=font)
    draw.rectangle(text_bbox, fill="red")
    draw.text((x, y - 22), label, fill="white", font=font)

    return pil_image


def annotate_frame(image_bytes: bytes, bbox: dict) -> bytes:
    """
    Draw ROI on a JPEG frame and return annotated JPEG bytes.

    Args:
        image_bytes: Raw JPEG bytes of the original frame.
        bbox: Detection result dict.

    Returns:
        Annotated JPEG bytes.
    """
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    annotated = draw_roi(pil_image, bbox)

    output = io.BytesIO()
    annotated.save(output, format="JPEG", quality=85)
    return output.getvalue()
