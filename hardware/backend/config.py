# =============================================================================
# config.py — Intelli-Flow AI Hardware Backend
# Edit ONLY this file before the demo. All IPs, paths, and thresholds live here.
# =============================================================================

# ── Network ──────────────────────────────────────────────────────────────────
ESP32_CAM_URL   = "http://192.168.43.120/stream"   # ESP32-CAM MJPEG stream URL
ESP32_CTRL_URL  = "http://192.168.43.150"           # ESP32 Controller base URL
ESP32_CTRL_PORT = 80                                # ESP32 Controller port
BACKEND_HOST    = "0.0.0.0"                         # Laptop backend listen host
BACKEND_PORT    = 8000                              # Laptop backend port

# ── Model Paths ───────────────────────────────────────────────────────────────
# Models live in hardware/finetuning/models/ (shared with the training pipeline)
DQN_WEIGHTS_PATH = "../finetuning/models/dqn_weights.h5"
YOLO_MODEL_PATH  = "../finetuning/models/yolov11s-fine-tuned.pt"

# ── Camera / Frame ────────────────────────────────────────────────────────────
FRAME_W = 640           # Expected frame width  (pixels)
FRAME_H = 480           # Expected frame height (pixels)

# STRIP_W: width (pixels) of each road arm as seen from overhead.
# ⚠️  CALIBRATE THIS before demo:
#   1. Place a ruler on one road arm.
#   2. View the live camera feed.
#   3. Measure how many pixels wide the arm appears.
#   4. Set that value here.
STRIP_W = 180

# ── Backend Timing ────────────────────────────────────────────────────────────
TICK_INTERVAL_S    = 1.0    # Seconds between each decision cycle
ESP32_POST_TIMEOUT = 0.5    # Max seconds to wait for ESP32 to respond
CAM_READ_TIMEOUT   = 5.0    # Seconds to wait for a frame before retrying

# ── DQN Action Map ────────────────────────────────────────────────────────────
# ⚠️  MUST MATCH the action space used during DQN training exactly.
# Phase strings match the RL model's own output format (hyphenated).
ACTION_MAP = {
    0: "NS-Green",
    1: "EW-Green",
    2: "All-Red",
}

# Junction ID to extract from the model's multi-junction output.
# The hardware demo runs a single physical junction.
# Change this to match whichever junction key your model uses for this demo.
JUNCTION_ID = "A0"

# Maps model phase string → ESP32 GPIO phase string
# Model uses:  "NS-Green", "EW-Green", "All-Red" (and emergency variants)
# ESP32 uses:  "NS_GREEN", "EW_GREEN", "ALL_RED", "EMERGENCY_N", ...
PHASE_TO_ESP32 = {
    "NS-Green":    "NS_GREEN",
    "EW-Green":    "EW_GREEN",
    "All-Red":     "ALL_RED",
    "Emergency-N": "EMERGENCY_N",
    "Emergency-S": "EMERGENCY_S",
    "Emergency-E": "EMERGENCY_E",
    "Emergency-W": "EMERGENCY_W",
}

# ── YOLO Classes ──────────────────────────────────────────────────────────────
# Class names must match the labels used during YOLOv11s fine-tuning exactly.
PCU_WEIGHTS = {
    "car":        1.0,   # Regular toy car → counted as traffic pressure
    "ambulance":  0.0,   # Not counted as pressure → triggers EMERGENCY override
    "fire_truck": 0.0,   # Same as ambulance
}

# Classes that trigger immediate emergency green corridor (bypass DQN entirely)
EMERGENCY_CLASSES = {"ambulance", "fire_truck"}

# ── Traffic Normalisation ─────────────────────────────────────────────────────
MAX_PCU = 40.0   # Max PCU per junction (used to normalise congestion_score 0–1)

# ── State Vector Constants (Indices 21–27) ───────────────────────────────────
# Fixed structural padding used by the DQN for normalisation.
# These are hardcoded constants from the training config — do not change.
STATE_CONSTANTS = [0.5, 1.0, 0.0, 0.5, 1.0, 0.0, 1.0]

# ── YOLO Detection Confidence ─────────────────────────────────────────────────
YOLO_CONF_THRESHOLD = 0.35   # Minimum confidence to count a detection
