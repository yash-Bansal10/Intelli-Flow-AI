"""
yolo_counter.py — Intelli-Flow AI Hardware Backend

Runs YOLOv11s fine-tuned on toy vehicles on each of the 4 lane zone crops.
Returns per-zone PCU counts and whether an emergency vehicle is present.

Emergency override logic:
  If "ambulance" or "fire_truck" is detected in ANY zone, this module
  sets emergency=True for that zone. The calling code in main.py will
  then SKIP the DQN and immediately send EMERGENCY_{ARM} to the ESP32.
"""

import logging
import numpy as np
from ultralytics import YOLO
from config import YOLO_MODEL_PATH, PCU_WEIGHTS, EMERGENCY_CLASSES, YOLO_CONF_THRESHOLD

logger = logging.getLogger(__name__)

# Zone name → arm initial for EMERGENCY phase string
_ARM_INITIAL = {"north": "N", "south": "S", "east": "E", "west": "W"}


class YoloCounter:
    """Loads YOLOv11s once at startup and runs inference on zone crops."""

    def __init__(self, model_path: str = YOLO_MODEL_PATH):
        logger.info(f"[YOLO] Loading model from {model_path} …")
        try:
            self.model = YOLO(model_path)
            self.model.fuse()  # optimise for inference
            logger.info("[YOLO] Model loaded successfully.")
        except Exception as e:
            logger.error(f"[YOLO] Failed to load model: {e}")
            self.model = None

    def is_ready(self) -> bool:
        return self.model is not None

    def count_zones(self, zone_crops: dict) -> dict:
        """
        Run YOLOv11s on each zone crop and return detection results.

        Args:
            zone_crops: dict from zone_detector.crop_zones()
                        {"north": np.ndarray, "south": np.ndarray, ...}

        Returns:
            dict: {
                "north": {
                    "count": int,           # total detected vehicles (incl. emergency)
                    "pcu": float,           # summed PCU (emergency classes = 0)
                    "emergency": bool,      # True if ambulance/fire_truck found here
                    "emergency_class": str, # "ambulance" / "fire_truck" / None
                    "boxes": [              # for overlay rendering
                        {"label": str, "box": [x1, y1, x2, y2], "conf": float}
                    ]
                },
                ...
            }
        """
        results = {}

        for arm, crop in zone_crops.items():
            if crop is None or self.model is None:
                results[arm] = self._empty_result()
                continue

            zone_result = self._run_inference(crop)
            results[arm] = zone_result

        return results

    def find_emergency_arm(self, zone_results: dict) -> str | None:
        """
        Check all zones for an emergency vehicle.
        Returns the first arm name found (e.g. "north"), or None.
        Checks in priority order: North → South → East → West.
        """
        for arm in ["north", "south", "east", "west"]:
            if zone_results.get(arm, {}).get("emergency", False):
                logger.warning(
                    f"[YOLO] 🚨 Emergency vehicle detected in {arm.upper()} arm! "
                    f"Class: {zone_results[arm]['emergency_class']}"
                )
                return arm
        return None

    # ── Internal ──────────────────────────────────────────────────────────────

    def _run_inference(self, crop: np.ndarray) -> dict:
        try:
            # Force imgsz=320 to massively speed up CPU inference (from 400ms to <100ms)
            preds = self.model(crop, conf=YOLO_CONF_THRESHOLD, imgsz=320, verbose=False)
        except Exception as e:
            logger.error(f"[YOLO] Inference error: {e}")
            return self._empty_result()

        boxes = []
        total_pcu = 0.0
        emergency = False
        emergency_class = None
        count = 0

        for result in preds:
            for box in result.boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                label = result.names[cls_id]
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]

                count += 1
                boxes.append({"label": label, "box": [x1, y1, x2, y2], "conf": conf})

                # Case-insensitive match — model outputs "Ambulance" (capital A) and "fire-truck" (hyphen)
                EMERGENCY_ALIAS = {"ambulance", "fire_truck", "fire-truck", "truck", "bus", "train", "motorcycle", "bicycle"}
                if label.lower() in EMERGENCY_ALIAS:
                    emergency = True
                    emergency_class = "ambulance"
                    # Emergency vehicles do NOT add to PCU pressure
                    
                    # Hackathon: Draw obnoxious Red bounding box for visual impact
                    import cv2
                    cv2.rectangle(crop, (x1, y1), (x2, y2), (0, 0, 255), 4)
                else:
                    total_pcu += PCU_WEIGHTS.get(label, 1.0)

        # Log all detections in this zone so we can diagnose misclassification
        if boxes:
            detected_labels = [f"{b['label']}({b['conf']:.2f})" for b in boxes]
            logger.info(f"[YOLO] Detections: {detected_labels} | emergency={emergency}")

        return {
            "count": count,
            "pcu": round(total_pcu, 2),
            "emergency": emergency,
            "emergency_class": emergency_class,
            "boxes": boxes,
        }

    @staticmethod
    def _empty_result() -> dict:
        return {"count": 0, "pcu": 0.0, "emergency": False,
                "emergency_class": None, "boxes": []}
