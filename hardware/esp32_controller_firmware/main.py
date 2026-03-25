# main.py — ESP32 Controller (MicroPython)
# HTTP REST server that receives phase commands from the laptop backend
# and drives 12 LEDs (4 arms × R/Y/G) via GPIO.
#
# Flash after boot.py:
#   ampy --port COM3 put main.py
#
# Wiring (220Ω resistor on each LED):
# ┌─────────┬────────────┬─────────────┬──────────┐
# │  ARM    │   GREEN    │   YELLOW    │   RED    │
# ├─────────┼────────────┼─────────────┼──────────┤
# │  North  │  GPIO 12   │  GPIO 13    │ GPIO 14  │
# │  South  │  GPIO 15   │  GPIO 16    │ GPIO 17  │
# │  East   │  GPIO 18   │  GPIO 19    │ GPIO 21  │
# │  West   │  GPIO 22   │  GPIO 23    │ GPIO 25  │
# └─────────┴────────────┴─────────────┴──────────┘

import json
import socket
from machine import Pin
import time

# ── GPIO Setup ────────────────────────────────────────────────────────────────
PINS = {
    "N_G": Pin(12, Pin.OUT),  "N_Y": Pin(13, Pin.OUT),  "N_R": Pin(14, Pin.OUT),
    "S_G": Pin(15, Pin.OUT),  "S_Y": Pin(16, Pin.OUT),  "S_R": Pin(17, Pin.OUT),
    "E_G": Pin(18, Pin.OUT),  "E_Y": Pin(19, Pin.OUT),  "E_R": Pin(21, Pin.OUT),
    "W_G": Pin(22, Pin.OUT),  "W_Y": Pin(23, Pin.OUT),  "W_R": Pin(25, Pin.OUT),
}

def all_off():
    for p in PINS.values():
        p.value(0)

def set_arm(arm_prefix, color):
    """Turn on one color for one arm, off all others on that arm."""
    PINS[f"{arm_prefix}_G"].value(1 if color == "G" else 0)
    PINS[f"{arm_prefix}_Y"].value(1 if color == "Y" else 0)
    PINS[f"{arm_prefix}_R"].value(1 if color == "R" else 0)

# ── Phase-to-LED Map ──────────────────────────────────────────────────────────
# Each phase string maps to (North, South, East, West) color codes
# G=Green, Y=Yellow, R=Red
PHASE_MAP = {
    "NS_GREEN":    ("G", "G", "R", "R"),
    "NS_YELLOW":   ("Y", "Y", "R", "R"),
    "EW_GREEN":    ("R", "R", "G", "G"),
    "EW_YELLOW":   ("R", "R", "Y", "Y"),
    "ALL_RED":     ("R", "R", "R", "R"),
    "EMERGENCY_N": ("G", "R", "R", "R"),
    "EMERGENCY_S": ("R", "G", "R", "R"),
    "EMERGENCY_E": ("R", "R", "G", "R"),
    "EMERGENCY_W": ("R", "R", "R", "G"),
}

ARM_PREFIXES = ["N", "S", "E", "W"]

def apply_phase(phase: str) -> bool:
    colors = PHASE_MAP.get(phase)
    if colors is None:
        print(f"[LED] ⚠️  Unknown phase '{phase}' — setting ALL_RED")
        colors = ("R", "R", "R", "R")
    for arm, color in zip(ARM_PREFIXES, colors):
        set_arm(arm, color)
    print(f"[LED] Phase applied: {phase} → N:{colors[0]} S:{colors[1]} E:{colors[2]} W:{colors[3]}")
    return True

# ── HTTP Server ───────────────────────────────────────────────────────────────
def parse_request(raw: bytes) -> tuple:
    """Parse raw HTTP bytes → (method, path, body_str)."""
    try:
        text = raw.decode("utf-8")
        lines = text.split("\r\n")
        method, path, _ = lines[0].split(" ")
        # Find body (after blank line)
        body = ""
        for i, line in enumerate(lines):
            if line == "" and i < len(lines) - 1:
                body = "\r\n".join(lines[i+1:]).strip()
                break
        return method, path, body
    except Exception:
        return "UNKNOWN", "/", ""


def make_response(status: int, body: dict) -> bytes:
    body_str = json.dumps(body)
    return (
        f"HTTP/1.1 {status} OK\r\n"
        f"Content-Type: application/json\r\n"
        f"Content-Length: {len(body_str)}\r\n"
        f"Access-Control-Allow-Origin: *\r\n"
        f"Connection: close\r\n"
        f"\r\n"
        f"{body_str}"
    ).encode("utf-8")


def run_server():
    server = socket.socket()
    server.bind(("0.0.0.0", 80))
    server.listen(3)
    server.settimeout(None)   # block until connection
    print("[Server] Listening on port 80 …")

    # Start with all-red as safe default
    all_off()
    apply_phase("ALL_RED")

    while True:
        try:
            conn, addr = server.accept()
            raw = conn.recv(2048)

            method, path, body = parse_request(raw)
            print(f"[HTTP] {method} {path} from {addr[0]}")

            # ── POST /set_phase ───────────────────────────────────────────────
            if method == "POST" and path == "/set_phase":
                try:
                    data = json.loads(body)
                    phase = data.get("current_phase", "ALL_RED")
                    apply_phase(phase)
                    resp = make_response(200, {"status": "ok", "phase_applied": phase})
                except Exception as e:
                    print(f"[HTTP] JSON parse error: {e}")
                    resp = make_response(400, {"status": "error", "detail": str(e)})

            # ── GET /ping ─────────────────────────────────────────────────────
            elif method == "GET" and path == "/ping":
                resp = make_response(200, {"status": "ok", "device": "esp32_controller"})

            # ── 404 ───────────────────────────────────────────────────────────
            else:
                resp = make_response(404, {"status": "error", "detail": "Not found"})

            conn.send(resp)
        except OSError as e:
            print(f"[Server] OSError: {e}")
        finally:
            try:
                conn.close()
            except Exception:
                pass

# ── Entry Point ───────────────────────────────────────────────────────────────
print("[ESP32 Controller] Starting up …")
run_server()
