"""
esp32_client.py — Intelli-Flow AI Hardware Backend

Sends the phase JSON to the ESP32 Controller via HTTP POST /set_phase.
Handles connection errors gracefully so a WiFi blip doesn't crash the system.
"""

import logging
import requests
import threading
import time
from config import ESP32_CTRL_URL, ESP32_POST_TIMEOUT

logger = logging.getLogger(__name__)

_ENDPOINT = f"{ESP32_CTRL_URL}/set_phase"
_status = {"last_seen": time.time(), "cpu_temp_c": None}

def _async_post(payload: dict):
    """Background executing task to push HTTP packet without locking the Global python thread."""
    try:
        resp = requests.post(
            _ENDPOINT,
            json=payload,
            timeout=ESP32_POST_TIMEOUT,
        )
        if resp.status_code == 200:
            _status["last_seen"] = time.time()
            data = resp.json()
            if data.get("status") == "ok":
                logger.debug(f"[ESP32] ✓ Phase applied: {data.get('phase_applied')}")
            else:
                logger.warning(f"[ESP32] Unexpected response: {data}")
        else:
            logger.warning(f"[ESP32] HTTP {resp.status_code}: {resp.text[:100]}")
    except requests.exceptions.Timeout:
        logger.warning(f"[ESP32] POST timed out after {ESP32_POST_TIMEOUT}s — device busy?")
    except requests.exceptions.ConnectionError:
        logger.warning(f"[ESP32] Connection refused at {_ENDPOINT} — device offline?")
    except Exception as e:
        logger.error(f"[ESP32] Unexpected error: {e}")

def send_phase(payload: dict) -> bool:
    """
    POST the phase payload to the ESP32 Controller.

    Args:
        payload: {
            "simulation_time": int,
            "current_phase": str,
            "queues": {"north": int, "south": int, "east": int, "west": int},
            "congestion_score": float
        }

    Returns:
        True instantly as the payload is dispatched to background threads.
    """
    thread = threading.Thread(target=_async_post, args=(payload,), daemon=True)
    thread.start()
    return True

def ping() -> bool:
    """
    Lightweight GET /ping — checks reachability and pulls CPU temperature.
    Returns True if the board responds with HTTP 200.
    """
    try:
        resp = requests.get(f"{ESP32_CTRL_URL}/ping", timeout=ESP32_POST_TIMEOUT)
        if resp.status_code == 200:
            _status["last_seen"] = time.time()
            data = resp.json()
            # Capture temperature if the firmware supports it
            if "cpu_temp_c" in data:
                _status["cpu_temp_c"] = data["cpu_temp_c"]
            return True
        return False
    except Exception:
        return False

def get_controller_temp_c() -> float | None:
    """Return the last known ESP32 CPU temperature, or None if not yet received."""
    return _status.get("cpu_temp_c")

def is_controller_alive() -> bool:
    """Returns True if the ESP32 Controller successfully responded within the last 7.0 seconds (3 dropped heartbeats tolerance)."""
    return (time.time() - _status["last_seen"]) < 7.0
