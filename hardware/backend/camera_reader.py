"""
camera_reader.py — Intelli-Flow AI Hardware Backend

Decoupled 2-Thread Architecture:
  Thread 1 (Capture)  → Continuously reads raw MJPEG frames from ESP32-CAM.
                         Always overwrites `_latest_raw` with the newest frame.
                         NEVER blocks waiting for inference.

  Thread 2 (Inference) → Reads `_latest_raw`, runs YOLO + annotation on it.
                          Always operates on frame N while capture grabs frame N+k.
                          Old frames are DROPPED, never queued.

This eliminates the core lag source: YOLO no longer blocks frame capture.
"""

import cv2
import time
import threading
import logging
import urllib.request
import numpy as np
from config import ESP32_CAM_URL, FRAME_W, FRAME_H, CAM_READ_TIMEOUT

logger = logging.getLogger(__name__)


class CameraReader:
    """
    Thread 1: Continuously reads raw frames from the ESP32-CAM MJPEG stream.
    Always overwrites the latest_raw slot — never queues.
    Inference thread reads from this slot independently at its own pace.
    """

    def __init__(self, url: str = ESP32_CAM_URL):
        self.url = url

        # ── Raw frame slot (written by Thread 1, read by Thread 2) ───────────
        self._latest_raw: np.ndarray | None = None
        self._raw_lock = threading.Lock()

        # ── Annotated frame slot (written by Thread 2, read by API) ──────────
        self._annotated_jpeg: bytes | None = None
        self._annotated_lock = threading.Lock()

        # ── Health tracking ───────────────────────────────────────────────────
        self._last_frame_time = 0.0          # updated by capture thread
        self._last_inference_time = 0.0      # updated by inference thread
        self._frame_count = 0                # monotonic frame counter

        self._running = False
        self._capture_thread: threading.Thread | None = None

    # ── Public API ────────────────────────────────────────────────────────────

    def start(self):
        """Start the background capture thread."""
        logger.info(f"[Camera] Starting capture thread → {self.url}")
        self._running = True
        self._capture_thread = threading.Thread(
            target=self._capture_loop, daemon=True, name="cam-capture"
        )
        self._capture_thread.start()

    def stop(self):
        """Gracefully stop the capture thread."""
        self._running = False
        logger.info("[Camera] Capture thread stopped.")

    def get_latest_raw(self) -> np.ndarray | None:
        """Return the most recent raw (unannotated) frame. Non-blocking."""
        with self._raw_lock:
            return self._latest_raw.copy() if self._latest_raw is not None else None

    def set_annotated_jpeg(self, jpeg_bytes: bytes):
        """Called by the inference thread to publish its annotated output."""
        with self._annotated_lock:
            self._annotated_jpeg = jpeg_bytes
        self._last_inference_time = time.time()

    def get_annotated_jpeg(self) -> bytes | None:
        """Called by the /api/yolo_feed endpoint. Returns last annotated JPEG."""
        with self._annotated_lock:
            return self._annotated_jpeg

    def is_alive(self) -> bool:
        """True if a raw frame was received within CAM_READ_TIMEOUT seconds."""
        return (time.time() - self._last_frame_time) < CAM_READ_TIMEOUT

    def get_frame_count(self) -> int:
        return self._frame_count

    def get_status(self) -> dict:
        return {
            "alive": self.is_alive(),
            "last_frame_age_s": round(time.time() - self._last_frame_time, 2),
            "total_frames": self._frame_count,
        }

    # ── Thread 1: Capture Loop ────────────────────────────────────────────────

    def _capture_loop(self):
        """
        Continuously pull JPEG frames from the ESP32-CAM's MJPEG HTTP stream.
        Decodes each frame and atomically overwrites the shared raw slot.
        Retries with a 2-second backoff on any connection failure.
        """
        while self._running:
            try:
                stream = urllib.request.urlopen(self.url, timeout=CAM_READ_TIMEOUT)
                buf = b""
                logger.info("[Camera] MJPEG stream opened.")

                while self._running:
                    chunk = stream.read(4096)
                    if not chunk:
                        logger.warning("[Camera] Stream ended — reconnecting…")
                        break

                    buf += chunk

                    # Locate JPEG markers
                    a = buf.find(b"\xff\xd8")
                    b = buf.find(b"\xff\xd9")

                    if a != -1 and b != -1:
                        jpg_bytes = buf[a : b + 2]
                        buf = buf[b + 2:]   # flush consumed bytes immediately

                        frame = cv2.imdecode(
                            np.frombuffer(jpg_bytes, dtype=np.uint8),
                            cv2.IMREAD_COLOR,
                        )

                        if frame is not None:
                            frame = cv2.resize(frame, (FRAME_W, FRAME_H))

                            # ── Atomic overwrite — drop previous raw frame ──
                            with self._raw_lock:
                                self._latest_raw = frame

                            self._last_frame_time = time.time()
                            self._frame_count += 1

            except Exception as exc:
                logger.error(f"[Camera] Capture error: {exc}. Retrying in 2s…")
                time.sleep(2)
