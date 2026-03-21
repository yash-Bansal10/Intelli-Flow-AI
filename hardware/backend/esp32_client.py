"""
esp32_client.py — Intelli-Flow AI Hardware Backend

Sends the phase JSON to the ESP32 Controller via HTTP POST /set_phase.
Handles connection errors gracefully so a WiFi blip doesn't crash the system.
"""

import logging
import requests
from config import ESP32_CTRL_URL, ESP32_POST_TIMEOUT

logger = logging.getLogger(__name__)

_ENDPOINT = f"{ESP32_CTRL_URL}/set_phase"


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
        True if ESP32 responded with {"status": "ok"}, False otherwise.
    """
    try:
        resp = requests.post(
            _ENDPOINT,
            json=payload,
            timeout=ESP32_POST_TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "ok":
                logger.debug(f"[ESP32] ✓ Phase applied: {data.get('phase_applied')}")
                return True
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

    return False


def ping() -> bool:
    """
    Send a lightweight GET request to check if the ESP32 is reachable.
    Returns True if reachable.
    """
    try:
        resp = requests.get(f"{ESP32_CTRL_URL}/ping", timeout=ESP32_POST_TIMEOUT)
        return resp.status_code == 200
    except Exception:
        return False
