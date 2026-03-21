"""
rl_model.py — Intelli-Flow AI Hardware Backend

Loads the trained DQN weights (.h5) and runs inference to select a traffic
signal phase action given the 28-element state vector.

⚠️  IMPORTANT — Architecture must match training:
    The build_dqn_architecture() function below must exactly replicate the
    neural network layers used during training. Confirm with your training
    code before running. If layer sizes differ, model.load_weights() will
    either crash or silently produce wrong outputs.
"""

import logging
import numpy as np
import tensorflow as tf
from config import DQN_WEIGHTS_PATH, ACTION_MAP

logger = logging.getLogger(__name__)

STATE_SIZE   = 28
ACTION_SIZE  = len(ACTION_MAP)


def build_dqn_architecture() -> tf.keras.Model:
    """
    Reconstruct the same DQN architecture used during training.

    ⚠️  Modify this function to match your training code exactly.
    The default below is a common 3-layer DQN for a 28-input, 3-action space.
    """
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(STATE_SIZE,)),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dense(64,  activation="relu"),
        tf.keras.layers.Dense(ACTION_SIZE, activation="linear"),  # Q-values
    ], name="dqn_inference")
    return model


class RLModel:
    """Loads DQN weights at startup and runs inference each tick."""

    def __init__(self, weights_path: str = DQN_WEIGHTS_PATH):
        self.model = None
        self._loaded = False
        self._load(weights_path)

    # ── Public API ─────────────────────────────────────────────────────────────

    def is_ready(self) -> bool:
        return self._loaded

    def predict_action(self, state_vector: np.ndarray) -> tuple[int, np.ndarray]:
        """
        Run inference on the state vector.

        Args:
            state_vector: numpy array shape (28,), dtype float32

        Returns:
            (action_index: int, q_values: np.ndarray shape (ACTION_SIZE,))
        """
        if not self._loaded:
            logger.error("[DQN] Model not loaded — returning default action 0")
            return 0, np.zeros(ACTION_SIZE)

        try:
            inp = state_vector.reshape(1, STATE_SIZE)
            q_values = self.model(inp, training=False).numpy()[0]
            action_index = int(np.argmax(q_values))
            return action_index, q_values
        except Exception as e:
            logger.error(f"[DQN] Inference error: {e}")
            return 0, np.zeros(ACTION_SIZE)

    def get_status(self) -> dict:
        return {
            "loaded": self._loaded,
            "weights_path": DQN_WEIGHTS_PATH,
            "action_size": ACTION_SIZE,
            "state_size": STATE_SIZE,
        }

    # ── Internal ───────────────────────────────────────────────────────────────

    def _load(self, weights_path: str):
        try:
            logger.info(f"[DQN] Building architecture …")
            self.model = build_dqn_architecture()

            logger.info(f"[DQN] Loading weights from {weights_path} …")
            self.model.load_weights(weights_path)
            self._loaded = True
            logger.info("[DQN] Model ready. ✓")
        except FileNotFoundError:
            logger.error(
                f"[DQN] Weights file '{weights_path}' not found. "
                "Place dqn_weights.h5 in hardware/backend/models/"
            )
        except Exception as e:
            logger.error(f"[DQN] Failed to load weights: {e}")
