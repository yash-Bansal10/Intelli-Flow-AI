"""
phase_decoder.py — Intelli-Flow AI Hardware Backend

Converts DQN output into phase strings, handles ESP32 phase mapping,
parses the multi-junction model output JSON, and computes queue/score metrics.

Model output format (example):
{
    "junctions": {
        "A0": {
            "phase": "EW-Green",
            "queues": [0.0, 0.0, 10.7, 59.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0],
            "score": 46
        },
        ...
    },
    "simulation_time": 290,
    "total_congestion": 420
}
"""

import logging
from config import ACTION_MAP, PHASE_TO_ESP32, JUNCTION_ID, MAX_PCU

logger = logging.getLogger(__name__)


def action_to_model_phase(action_index: int) -> str:
    """
    Map DQN action index → model-format phase string (e.g. "NS-Green").

    Args:
        action_index: integer from argmax(q_values)

    Returns:
        Phase string in model format e.g. "NS-Green", "EW-Green", "All-Red"
    """
    phase = ACTION_MAP.get(action_index)
    if phase is None:
        logger.warning(f"[Decoder] Unknown action index {action_index}. Defaulting to All-Red.")
        return "All-Red"
    return phase


def model_phase_to_esp32(model_phase: str) -> str:
    """
    Convert model-format phase string → ESP32 GPIO format.

    Examples:
        "NS-Green"    → "NS_GREEN"
        "EW-Green"    → "EW_GREEN"
        "Emergency-N" → "EMERGENCY_N"

    Fallback: "ALL_RED" for any unknown string.
    """
    esp32_phase = PHASE_TO_ESP32.get(model_phase)
    if esp32_phase is None:
        logger.warning(f"[Decoder] No ESP32 mapping for '{model_phase}'. Defaulting to ALL_RED.")
        return "ALL_RED"
    return esp32_phase


def arm_to_emergency_model_phase(arm: str) -> str:
    """
    Convert an arm name to the CORRIDOR model-format phase for EVP.

    Ambulance in North or South → give the entire NS corridor green
    Ambulance in East  or West  → give the entire EW corridor green

    This ensures the emergency vehicle AND oncoming traffic in its
    corridor both get a clear path. Routes through NS_GREEN/EW_GREEN
    on the ESP32 so the yellow transition (Red→Yellow→Green) is
    applied automatically by the firmware.

    Args:
        arm: "north" | "south" | "east" | "west"

    Returns:
        "NS-Green" | "EW-Green"
    """
    arm = arm.lower()
    if arm in ("north", "south"):
        return "NS-Green"
    elif arm in ("east", "west"):
        return "EW-Green"
    else:
        logger.warning(f"[Decoder] Unknown arm '{arm}' for EVP — defaulting to NS-Green")
        return "NS-Green"


def queues_list_to_dict(queues_list: list) -> dict:
    """
    Convert the model's 12-element queues list to a N/S/E/W dict.

    The 12 lanes map exactly to state vector indices 0–11:
        [0,1,2]   → North lanes → sum → north
        [3,4,5]   → South lanes → sum → south
        [6,7,8]   → East  lanes → sum → east
        [9,10,11] → West  lanes → sum → west

    Returns:
        {"north": int, "south": int, "east": int, "west": int}
    """
    if len(queues_list) < 12:
        queues_list = list(queues_list) + [0.0] * (12 - len(queues_list))

    return {
        "north": round(queues_list[0] + queues_list[1]  + queues_list[2]),
        "south": round(queues_list[3] + queues_list[4]  + queues_list[5]),
        "east":  round(queues_list[6] + queues_list[7]  + queues_list[8]),
        "west":  round(queues_list[9] + queues_list[10] + queues_list[11]),
    }


def build_model_output(
    junction_id: str,
    model_phase: str,
    queues_list: list,
    score: int,
    simulation_time: int,
) -> dict:
    """
    Build the full multi-junction model output dict for the dashboard API.
    Matches the exact format produced by the RL model.

    Returns:
        {
            "junctions": {
                "<junction_id>": {
                    "phase": "NS-Green",
                    "queues": [...12 floats...],
                    "score": 46
                }
            },
            "simulation_time": 42,
            "total_congestion": 46
        }
    """
    return {
        "junctions": {
            junction_id: {
                "phase":  model_phase,
                "queues": queues_list,
                "score":  score,
            }
        },
        "simulation_time":   simulation_time,
        "total_congestion":  score,   # single junction → total = its score
    }


def compute_score_from_pcu(zone_results: dict) -> int:
    """
    Compute an integer score from YOLO zone pcu values.
    Used as the 'score' field in the model output format.
    A higher PCU means more congestion → score represents total traffic load.
    """
    total = sum(zone_results.get(arm, {}).get("pcu", 0.0)
                for arm in ["north", "south", "east", "west"])
    return round(total)


def compute_congestion_score(zone_results: dict) -> float:
    """
    Normalised 0.0–1.0 congestion score (used internally in ESP32 payload).
    """
    total_pcu = sum(
        zone_results.get(arm, {}).get("pcu", 0.0)
        for arm in ["north", "south", "east", "west"]
    )
    return round(min(total_pcu / MAX_PCU, 1.0), 3)
