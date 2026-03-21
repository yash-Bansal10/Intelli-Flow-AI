"""
state_builder.py — Intelli-Flow AI Hardware Backend

Assembles the 28-element float32 state vector that the DQN model expects.

Index layout:
  0-2   : PCU North lanes 1,2,3  (zone_pcu / 3 each)
  3-5   : PCU South lanes 1,2,3
  6-8   : PCU East  lanes 1,2,3
  9-11  : PCU West  lanes 1,2,3
  12    : Current phase  (1.0 = NS_GREEN, 0.0 = EW_GREEN)
  13-16 : Neighbor pressures N,S,E,W  (simulated / manual override)
  17-20 : EVP flags N,S,E,W  (auto-set by ambulance detection or manual)
  21-27 : Structural constants from config.STATE_CONSTANTS
"""

import numpy as np
from config import STATE_CONSTANTS

# Arm index mapping for EVP (indices 17–20)
_EVP_INDEX = {"north": 17, "south": 18, "east": 19, "west": 20}

# Neighbor pressure index mapping (indices 13–16)
_NBR_INDEX = {"north": 13, "south": 14, "east": 15, "west": 16}


class StateBuilder:
    """
    Maintains mutable state (neighbor pressures, EVP bits) across ticks
    and assembles a fresh 28-element state vector each tick.
    """

    def __init__(self):
        # Simulated neighbor pressures — set via /api/set_neighbor_pressure
        self._neighbor_pressure = {"north": 0.0, "south": 0.0,
                                   "east": 0.0, "west": 0.0}
        # Emergency override bits — set by YOLO or via /api/trigger_emergency
        self._evp = {"north": 0.0, "south": 0.0, "east": 0.0, "west": 0.0}

    # ── Public API ─────────────────────────────────────────────────────────────

    def build(self, zone_results: dict, current_phase: str,
              emergency_arm: str | None = None) -> np.ndarray:
        """
        Build the 28-element state vector.

        Args:
            zone_results:   Output of YoloCounter.count_zones()
            current_phase:  Phase string currently active (e.g. "NS_GREEN")
            emergency_arm:  Arm where an emergency vehicle was detected (or None)

        Returns:
            numpy array, shape (28,), dtype float32
        """
        state = np.zeros(28, dtype=np.float32)

        # ── Indices 0–11: PCU per lane ─────────────────────────────────────────
        arm_order = ["north", "south", "east", "west"]
        for i, arm in enumerate(arm_order):
            total_pcu = zone_results.get(arm, {}).get("pcu", 0.0)
            per_lane = total_pcu / 3.0   # Split evenly across 3 lanes
            base = i * 3
            state[base]     = per_lane
            state[base + 1] = per_lane
            state[base + 2] = per_lane

        # ── Index 12: Current phase ────────────────────────────────────────────
        state[12] = 1.0 if current_phase in ("NS_GREEN", "NS_YELLOW") else 0.0

        # ── Indices 13–16: Neighbor pressures ─────────────────────────────────
        for arm, idx in _NBR_INDEX.items():
            state[idx] = self._neighbor_pressure[arm]

        # ── Indices 17–20: EVP flags ───────────────────────────────────────────
        # Reset all EVP flags each tick, then set the current one
        for arm in self._evp:
            self._evp[arm] = 0.0
        if emergency_arm:
            self._evp[emergency_arm] = 1.0
        for arm, idx in _EVP_INDEX.items():
            state[idx] = self._evp[arm]

        # ── Indices 21–27: Structural constants ────────────────────────────────
        for j, val in enumerate(STATE_CONSTANTS):
            state[21 + j] = val

        return state

    def set_neighbor_pressure(self, arm: str, value: float):
        """Called by the dashboard API to inject simulated neighbor pressure."""
        if arm in self._neighbor_pressure:
            self._neighbor_pressure[arm] = float(value)

    def manual_trigger_emergency(self, arm: str):
        """Called by the dashboard Emergency button to set an EVP flag manually."""
        if arm in self._evp:
            self._evp[arm] = 1.0

    def reset_evp(self):
        """Reset all EVP flags (called when emergency clears)."""
        for arm in self._evp:
            self._evp[arm] = 0.0

    def get_neighbor_pressures(self) -> dict:
        return dict(self._neighbor_pressure)
