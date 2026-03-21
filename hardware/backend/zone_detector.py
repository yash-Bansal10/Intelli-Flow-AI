"""
zone_detector.py — Intelli-Flow AI Hardware Backend

Divides the top-down junction frame into 4 lane zones corresponding to the
North, South, East, and West road arms of the plus-shaped (+) junction.

Frame layout (640×480 example):

    +────────────────────────────────────────+
    │             NORTH ZONE                 │  y: 0  → cy - strip_w//2
    +──────────┬─────────────┬───────────────+
    │          │             │               │
    │  WEST    │   CENTER    │   EAST        │  y: cy - strip_w//2 → cy + strip_w//2
    │  ZONE    │  (ignored)  │   ZONE        │
    │          │             │               │
    +──────────┴─────────────┴───────────────+
    │             SOUTH ZONE                 │  y: cy + strip_w//2 → h
    +────────────────────────────────────────+

strip_w controls how wide the road arm appears in pixels — calibrate in config.py.
"""

import cv2
import numpy as np
from config import FRAME_W, FRAME_H, STRIP_W

# Pre-compute zone boundaries once at import time
_CX = FRAME_W // 2
_CY = FRAME_H // 2
_HW = STRIP_W // 2  # half-width of the road arm

ZONE_COORDS = {
    "north": ((_CX - _HW, 0),            (_CX + _HW, _CY - _HW)),
    "south": ((_CX - _HW, _CY + _HW),   (_CX + _HW, FRAME_H)),
    "east":  ((_CX + _HW, _CY - _HW),   (FRAME_W,   _CY + _HW)),
    "west":  ((0,          _CY - _HW),   (_CX - _HW, _CY + _HW)),
}

# Colours for debug overlay (BGR)
_ZONE_COLORS = {
    "north": (0, 255, 0),    # green
    "south": (255, 0, 0),    # blue
    "east":  (0, 255, 255),  # yellow
    "west":  (0, 165, 255),  # orange
}


def crop_zones(frame: np.ndarray) -> dict:
    """
    Crop the frame into 4 zone images.

    Returns:
        dict mapping arm name → cropped numpy array (or None if out-of-bounds)
    """
    zones = {}
    for name, ((x1, y1), (x2, y2)) in ZONE_COORDS.items():
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(FRAME_W, x2), min(FRAME_H, y2)
        if x2 > x1 and y2 > y1:
            zones[name] = frame[y1:y2, x1:x2].copy()
        else:
            zones[name] = None
    return zones


def draw_zone_overlay(frame: np.ndarray, detections: dict | None = None) -> np.ndarray:
    """
    Draw zone boundaries and optional detection bounding boxes on the frame.

    Args:
        frame:      Raw BGR frame from the camera.
        detections: Optional dict from yolo_counter.count_zones():
                    {"north": {"count": 2, "pcu": 2.0, "emergency": False,
                               "boxes": [{"label": "car", "box": [x1,y1,x2,y2]}]}}

    Returns:
        Annotated frame (copy).
    """
    annotated = frame.copy()

    for name, ((x1, y1), (x2, y2)) in ZONE_COORDS.items():
        color = _ZONE_COLORS[name]
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        cv2.putText(annotated, name.upper(), (x1 + 4, y1 + 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

        # Overlay YOLO detection boxes if provided
        if detections and name in detections:
            zone_data = detections[name]
            for det in zone_data.get("boxes", []):
                label = det["label"]
                bx1, by1, bx2, by2 = det["box"]
                # Translate box coords from zone-local to full-frame coords
                fx1, fy1 = x1 + bx1, y1 + by1
                fx2, fy2 = x1 + bx2, y1 + by2
                box_color = (0, 0, 255) if label in ("ambulance", "fire_truck") else (255, 255, 255)
                cv2.rectangle(annotated, (fx1, fy1), (fx2, fy2), box_color, 2)
                cv2.putText(annotated, label, (fx1, fy1 - 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 1)

            # PCU badge
            pcu_text = f"PCU:{zone_data['pcu']:.1f}"
            cv2.putText(annotated, pcu_text, (x1 + 4, y2 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

    # Draw centre crosshair
    cv2.line(annotated, (_CX, 0), (_CX, FRAME_H), (128, 128, 128), 1)
    cv2.line(annotated, (0, _CY), (FRAME_W, _CY), (128, 128, 128), 1)

    return annotated
