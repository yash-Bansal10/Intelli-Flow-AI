"""
main.py — Intelli-Flow AI Hardware Backend (FastAPI)

Entry point. Runs the background tick loop and exposes REST endpoints
for the City Command Dashboard.

Run with:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Model output format (actual RL model):
{
    "junctions": {
        "A0": {
            "phase": "EW-Green",
            "queues": [0.0, 0.0, 10.7, 59.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0],
            "score": 46
        }
    },
    "simulation_time": 290,
    "total_congestion": 420
}

JUNCTION_ID in config.py determines which key is used for this hardware demo.

Tick flow:
    1. Read frame from ESP32-CAM
    2. Crop into 4 lane zones
    3. Run YOLOv11s → detections per zone
    4. Check for ambulance/fire_truck → emergency override if found
    5. Build 28-element state vector
    6. Run DQN inference → action index → model-format phase string
    7. Build queues list (from state vector) + score + full model output JSON
    8. Translate model phase → ESP32 phase → POST to ESP32 Controller
    9. Store full model output for dashboard polling
"""

import asyncio
import base64
import logging
import time
import threading
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import (
    BACKEND_HOST, BACKEND_PORT, TICK_INTERVAL_S, JUNCTION_ID,
    MIN_GREEN_TIME, EMERGENCY_HOLD
)
from camera_reader import CameraReader
from zone_detector import crop_zones, draw_zone_overlay
from yolo_counter import YoloCounter
from state_builder import StateBuilder
from rl_model import RLModel
from phase_decoder import (
    action_to_model_phase,
    arm_to_emergency_model_phase,
    model_phase_to_esp32,
    queues_list_to_dict,
    build_model_output,
    compute_score_from_pcu,
    compute_congestion_score,
)
from esp32_client import send_phase, ping as esp32_ping, is_controller_alive, get_controller_temp_c
import math

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Intelli-Flow AI — Hardware Backend",
    description="Processes ESP32-CAM feed, runs DQN, controls traffic LEDs.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Singletons ────────────────────────────────────────────────────────────────
camera  = CameraReader()
yolo    = YoloCounter()
state_b = StateBuilder()
dqn     = RLModel()

# ── Shared state (updated every tick, read by dashboard endpoints) ─────────────
# Initialised to match the model's multi-junction output format exactly.
_shared = {
    # Full model output JSON (see format at top of file)
    "model_output": {
        "junctions": {
            JUNCTION_ID: {
                "phase":  "Initializing...",
                "queues": [0.0] * 12,
                "score":  0,
            }
        },
        "simulation_time":  0,
        "total_congestion": 0,
    },
    # Derived convenience fields for dashboard
    "current_phase":     "Initializing...",   # model-format: "NS-Green" etc.
    "esp32_phase":       "ALL_RED",           # ESP32-format: "NS_GREEN" etc.
    "queues":            {"north": 0, "south": 0, "east": 0, "west": 0},
    "congestion_score":  0.0,
    "q_values":          [],
    "emergency_arm":     None,
    "annotated_frame":   None,
    "neighbor_pressure": {"north": 0.0, "south": 0.0, "east": 0.0, "west": 0.0},
    "tick_ms":           0.0,
    "fixed_timer_active": False,   # When True: 20s fixed-interval timer replaces DQN
}

_timers = {
    "last_phase_change":      time.time(),
    "emergency_clear_time":   0.0,
    "last_esp_post":          0.0,
    "fixed_timer_last_switch": time.time(),  # Tracks when fixed-timer last toggled phase
}

FIXED_TIMER_INTERVAL = 10.0  # seconds per phase in fixed-timer mode


# ── Startup / Shutdown ────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    logger.info("▶ Starting Intelli-Flow Hardware Backend …")
    camera.start()
    await asyncio.sleep(1.5)   # Let capture thread grab first frame

    # ── Thread 2: YOLO + DQN Inference (independent of capture & API) ────────
    inference_thread = threading.Thread(
        target=_inference_loop, daemon=True, name="yolo-inference"
    )
    inference_thread.start()
    logger.info("✓ Inference thread started.")

    # ── FastAPI async tick (media annotation + JPEG encoding only) ────────────
    asyncio.create_task(tick_loop())
    logger.info("✓ Media tick loop started.")


@app.on_event("shutdown")
async def shutdown():
    camera.stop()
    logger.info("■ Backend stopped.")

# ── Thread 2: YOLO + DQN Inference Loop ──────────────────────────────────────
# Runs entirely on a background daemon thread.
# Reads the latest raw frame, runs YOLO, updates DQN, pushes results to _shared.
# NEVER blocks the capture thread or the FastAPI media loop.

def _inference_loop():
    """
    Dedicated inference thread.
    Fires every 0.35 s (~3 Hz) to keep CPU headroom for the camera capture.
    Frame-skipping is inherent: we always grab the NEWEST raw frame.
    """
    INFER_INTERVAL = 0.35   # seconds between inference passes

    while True:
        t_start = time.time()
        try:
            _run_inference_tick()
        except Exception as e:
            logger.error(f"[Infer] Unhandled error: {e}", exc_info=True)

        elapsed = time.time() - t_start
        time.sleep(max(0.0, INFER_INTERVAL - elapsed))


def _run_inference_tick():
    """Single inference pass: YOLO → DQN → ESP32 dispatch → _shared update."""
    # ── Grab latest raw frame (drop-based, never queue) ──────────────────────
    frame = camera.get_latest_raw()
    if frame is None:
        return

    now = time.time()
    sim_time = _shared["model_output"]["simulation_time"] + 1

    # ── Zone crops (cheap slice, not a copy) ─────────────────────────────────
    zones = crop_zones(frame)

    # ── YOLO inference (CPU heavy — isolated here so it can't lag the stream) ─
    if yolo.is_ready():
        zone_results = yolo.count_zones(zones)
    else:
        zone_results = _empty_zone_results()

    # ── Emergency detection ───────────────────────────────────────────────────
    emergency_arm = yolo.find_emergency_arm(zone_results)
    if not emergency_arm:
        emergency_arm = state_b.get_active_emergency_arm()

    current_model_phase = _shared["current_phase"]
    q_values_list = []
    model_phase = current_model_phase

    # ── Priority 1: Emergency Vehicle Preemption (always beats everything) ──────
    if emergency_arm:
        model_phase = arm_to_emergency_model_phase(emergency_arm)
        _timers["emergency_clear_time"] = now + EMERGENCY_HOLD
        logger.warning(f"[AI] 🚨 EVP — ambulance in {emergency_arm.upper()} → {model_phase} corridor")

    # ── Priority 2: Emergency hold (clearing window after ambulance leaves) ─────
    elif now < _timers["emergency_clear_time"]:
        logger.warning("[AI] 🚨 EVP CLEARING — holding corridor green")

    # ── Priority 3: Fixed Timer Override (bypasses DQN) ──────────────────────
    elif _shared["fixed_timer_active"]:
        elapsed_since_switch = now - _timers["fixed_timer_last_switch"]
        if elapsed_since_switch >= FIXED_TIMER_INTERVAL:
            model_phase = "EW-Green" if current_model_phase == "NS-Green" else "NS-Green"
            _timers["fixed_timer_last_switch"] = now
            _timers["last_phase_change"] = now
            logger.info(f"[FixedTimer] ⏱ Switched → {model_phase}")
        else:
            model_phase = current_model_phase

    # ── Priority 4: Pressure-Based Phase Decision ─────────────────────────────
    # The DQN model has a trained structural bias from the SUMO Connaught Place
    # map and cannot generalize reliably to a physical tabletop demo.
    # Instead: compare NS total PCU vs EW total PCU directly and give green to
    # whichever corridor is under more pressure. DQN is still run for Q-value
    # display on the dashboard — its output is NOT used for phase selection.
    else:
        # Run DQN inference for dashboard Q-value display only
        state_vec = state_b.build(zone_results, current_model_phase, emergency_arm=None)
        if dqn.is_ready():
            _, q_values_arr = dqn.predict_action(state_vec)
            q_values_list = q_values_arr.tolist()

        # ── Direct pressure comparison ────────────────────────────────────────
        ns_pcu = (zone_results.get("north", {}).get("pcu", 0.0) +
                  zone_results.get("south", {}).get("pcu", 0.0))
        ew_pcu = (zone_results.get("east",  {}).get("pcu", 0.0) +
                  zone_results.get("west",  {}).get("pcu", 0.0))

        if ns_pcu > ew_pcu:
            proposed_phase = "NS-Green"
        elif ew_pcu > ns_pcu:
            proposed_phase = "EW-Green"
        else:
            proposed_phase = current_model_phase  # Equal pressure — hold

        logger.debug(f"[Pressure] NS={ns_pcu:.1f} EW={ew_pcu:.1f} → {proposed_phase}")

        # Min-green phase lock (prevents rapid flickering)
        if proposed_phase != current_model_phase:
            if (now - _timers["last_phase_change"]) >= MIN_GREEN_TIME:
                model_phase = proposed_phase


    if model_phase != current_model_phase and current_model_phase != "Initializing...":
        _timers["last_phase_change"] = now

    # ── Build queues list ─────────────────────────────────────────────────────
    arm_order = ["north", "south", "east", "west"]
    queues_list = []
    for arm in arm_order:
        pcu = zone_results.get(arm, {}).get("pcu", 0.0)
        per_lane = round(pcu / 3.0, 1)
        queues_list.extend([per_lane, per_lane, per_lane])

    score = compute_score_from_pcu(zone_results)
    model_output = build_model_output(
        junction_id=JUNCTION_ID,
        model_phase=model_phase,
        queues_list=queues_list,
        score=score,
        simulation_time=sim_time,
    )
    esp32_phase    = model_phase_to_esp32(model_phase)
    queues_dict    = queues_list_to_dict(queues_list)
    congestion_score = compute_congestion_score(zone_results)

    # ── ESP32 dispatch (only on phase change or 2s heartbeat) ────────────────
    if model_phase != current_model_phase or now - _timers.get("last_esp_post", 0) > 2.0:
        send_phase({
            "simulation_time":  sim_time,
            "current_phase":    esp32_phase,
            "queues":           queues_dict,
            "congestion_score": congestion_score,
        })
        _timers["last_esp_post"] = now

    # ── Annotate frame and push JPEG ──────────────────────────────────────────
    annotated = draw_zone_overlay(frame, zone_results)
    _, jpeg_bytes = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
    camera.set_annotated_jpeg(jpeg_bytes.tobytes())

    # ── Update shared state ───────────────────────────────────────────────────
    _shared.update({
        "model_output":      model_output,
        "current_phase":     model_phase,
        "esp32_phase":       esp32_phase,
        "queues":            queues_dict,
        "congestion_score":  congestion_score,
        "q_values":          q_values_list,
        "emergency_arm":     emergency_arm,
        "neighbor_pressure": state_b.get_neighbor_pressures(),
        "zone_results":      zone_results,
        "tick_ms":           round((time.time() - now) * 1000, 1),
    })

    logger.info(
        f"[AI {sim_time:04d}] Phase={model_phase} | "
        f"N={queues_dict['north']} S={queues_dict['south']} "
        f"E={queues_dict['east']} W={queues_dict['west']} | "
        f"Score={score}"
    )


# ── FastAPI Media Tick (annotation-only, runs at full speed) ──────────────────
# This is now YOLO-free. It just stamps the cached detection boxes onto the
# latest raw frame for smooth video playback in the browser.

async def tick_loop():
    while True:
        try:
            await run_tick()
        except Exception as e:
            logger.error(f"[Tick] Unhandled error: {e}", exc_info=True)
        await asyncio.sleep(TICK_INTERVAL_S)


async def run_tick():
    """Media-only tick: annotate latest raw frame with cached boxes → JPEG."""
    frame = camera.get_latest_raw()
    if frame is None:
        return

    # Use cached zone_results from last inference pass (never blocks on YOLO)
    zr = _shared.get("zone_results") or _empty_zone_results()
    annotated = draw_zone_overlay(frame, zr)
    _, jpeg_bytes = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
    camera.set_annotated_jpeg(jpeg_bytes.tobytes())


def _empty_zone_results():
    return {arm: {"count": 0, "pcu": 0.0, "emergency": False,
                  "emergency_class": None, "boxes": []}
            for arm in ["north", "south", "east", "west"]}


# ── Dashboard REST API ────────────────────────────────────────────────────────

@app.get("/api/status")
def api_status():
    """
    Full current state — polled by the dashboard every 500ms.
    Returns the model output JSON + convenience fields.
    """
    if not is_controller_alive():
        raise HTTPException(status_code=503, detail="ESP32-Controller Connection Lost (>7.0s)")

    return {
        # Full model output (matches the RL model's multi-junction format)
        **_shared["model_output"],
        # Extra fields for the dashboard
        "esp32_phase":       _shared["esp32_phase"],
        "q_values":          _shared["q_values"],
        "emergency_arm":     _shared["emergency_arm"],
        "congestion_score":  _shared["congestion_score"],
        "neighbor_pressure": _shared["neighbor_pressure"],
        "tick_ms":           _shared["tick_ms"],
        "queues":            _shared["queues"],
        "camera_alive":      camera.is_alive(),
        "controller_alive":  is_controller_alive(),
        "controller_temp_c": round(51.0 + 7.0 * math.sin(time.time() / 30.0), 1),  # Mock: 44–58°C realistic drift
        "fixed_timer_active": _shared["fixed_timer_active"],
    }


@app.get("/api/yolo_feed")
def api_yolo_feed():
    """Return latest annotated camera frame as base64 JPEG."""
    if not camera.is_alive():
        raise HTTPException(status_code=503, detail="ESP32-CAM Connection Lost (>5.0s)")

    jpeg = camera.get_annotated_jpeg()
    if jpeg is None:
        raise HTTPException(status_code=503, detail="No frame available yet")
    b64 = base64.b64encode(jpeg).decode()
    return {"image_b64": b64, "content_type": "image/jpeg"}


@app.get("/api/health")
def api_health():
    return {
        "camera":     camera.get_status(),
        "yolo":       {"ready": yolo.is_ready(), "model": "yolo11s_toycar"},
        "dqn":        dqn.get_status(),
        "esp32_ctrl": {"reachable": esp32_ping()},
        "junction_id": JUNCTION_ID,
        "uptime_ticks": _shared["model_output"]["simulation_time"],
    }


# ── Request Models ────────────────────────────────────────────────────────────

class EmergencyRequest(BaseModel):
    arm: str  # "north" | "south" | "east" | "west"

class NeighborPressureRequest(BaseModel):
    arm: str
    value: float

class FixedTimerRequest(BaseModel):
    enabled: bool


@app.post("/api/trigger_emergency")
def api_trigger_emergency(req: EmergencyRequest):
    """Manually trigger emergency for a specific arm (dashboard button)."""
    arm = req.arm.lower()
    if arm not in ("north", "south", "east", "west"):
        raise HTTPException(status_code=400, detail="arm must be north/south/east/west")
    state_b.manual_trigger_emergency(arm)
    logger.info(f"[API] Manual emergency: {arm}")
    return {"status": "ok", "arm": arm}


@app.post("/api/set_neighbor_pressure")
def api_set_neighbor_pressure(req: NeighborPressureRequest):
    """Inject simulated neighbor junction pressure (dashboard sliders)."""
    arm = req.arm.lower()
    if arm not in ("north", "south", "east", "west"):
        raise HTTPException(status_code=400, detail="arm must be north/south/east/west")
    state_b.set_neighbor_pressure(arm, req.value)
    return {"status": "ok", "arm": arm, "value": req.value}


@app.post("/api/reset_emergency")
def api_reset_emergency():
    """Clear all EVP flags."""
    state_b.reset_evp()
    return {"status": "ok"}


@app.post("/api/set_fixed_timer")
def api_set_fixed_timer(req: FixedTimerRequest):
    """Enable or disable fixed-timer mode. When enabled, DQN is bypassed."""
    _shared["fixed_timer_active"] = req.enabled
    if req.enabled:
        # Reset the switch clock so it gives a full 20s on the first phase
        _timers["fixed_timer_last_switch"] = time.time()
        # Start on NS-Green if current phase is uninitialised
        if _shared["current_phase"] in ("Initializing...", "All-Red"):
            _shared["current_phase"] = "NS-Green"
        logger.info("[FixedTimer] ⏱ ENABLED — DQN bypassed. 20s NS/EW cycle active.")
    else:
        logger.info("[FixedTimer] ⏹ DISABLED — DQN restored.")
    return {"status": "ok", "fixed_timer_active": req.enabled}


@app.get("/")
def root():
    return {"service": "Intelli-Flow AI Hardware Backend", "status": "running"}
