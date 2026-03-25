"""
camera_reader.py — Intelli-Flow AI Hardware Backend
Reads the MJPEG stream from the ESP32-CAM and returns decoded frames.
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
    Continuously reads frames from the ESP32-CAM MJPEG stream in a background
    thread. The latest frame is always available via get_latest_frame().

    This prevents the main tick loop from blocking if the camera is slow.
    """

    def __init__(self, url: str = ESP32_CAM_URL):
        self.url = url
        self._frame = None
        self._lock = threading.Lock()
        self._running = False
        self._cap = None
        self._thread = None
        self._last_frame_time = 0.0

    # ── Public API ─────────────────────────────────────────────────────────────

    def start(self):
        """Open the MJPEG stream and start the background reader thread."""
        logger.info(f"[Camera] Connecting to {self.url}")
        self._running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop the reader thread and release the stream."""
        self._running = False
        if self._cap:
            self._cap.release()
        logger.info("[Camera] Stopped.")

    def get_latest_frame(self):
        """
        Return the most recently decoded frame as a numpy array (BGR, HxWx3).
        Returns None if no frame has been received yet.
        """
        with self._lock:
            return self._frame.copy() if self._frame is not None else None

    def is_alive(self) -> bool:
        """True if a frame was received within the last CAM_READ_TIMEOUT seconds."""
        return (time.time() - self._last_frame_time) < CAM_READ_TIMEOUT

    def get_status(self) -> dict:
        return {
            "connected": self._cap is not None and self._cap.isOpened(),
            "alive": self.is_alive(),
            "last_frame_age_s": round(time.time() - self._last_frame_time, 2),
        }

    # ── Internal ───────────────────────────────────────────────────────────────

    def _read_loop(self):
        while self._running:
            try:
                # Open the stream using native python urllib with a strict timeout
                stream = urllib.request.urlopen(self.url, timeout=CAM_READ_TIMEOUT)
                bytes_buffer = b''
                logger.info("[Camera] Stream opened successfully (Native HTTP).")
                
                while self._running:
                    chunk = stream.read(4096)
                    if not chunk:
                        logger.warning("[Camera] Stream ended prematurely. Reconnecting…")
                        break
                        
                    bytes_buffer += chunk
                    
                    # Search for standard JPEG header/footer bytes in the buffer
                    a = bytes_buffer.find(b'\xff\xd8')
                    b = bytes_buffer.find(b'\xff\xd9')
                    
                    if a != -1 and b != -1:
                        # Extract the exact JPEG bytecode
                        jpg = bytes_buffer[a:b+2]
                        # Flush the buffer memory
                        bytes_buffer = bytes_buffer[b+2:]
                        
                        # Decode the physical bytes instantly via OpenCV CPU
                        frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
                        
                        if frame is not None:
                            frame = cv2.resize(frame, (FRAME_W, FRAME_H))
                            with self._lock:
                                self._frame = frame
                            self._last_frame_time = time.time()
                            
            except Exception as e:
                logger.error(f"[Camera] Physical Disconnect: {e}. Retrying strictly in 2s…")
                time.sleep(2)
