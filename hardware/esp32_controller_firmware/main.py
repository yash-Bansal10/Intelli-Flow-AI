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
# │  East   │  GPIO 18   │  GPIO 19    │ GPIO 26  │
# │  West   │  GPIO 22   │  GPIO 23    │ GPIO 25  │
# └─────────┴────────────┴─────────────┴──────────┘

import json
import socket
from machine import Pin
import time
import esp32   # Built-in MicroPython module for ESP32 system info

# ── GPIO Setup ────────────────────────────────────────────────────────────────
# NOTE: GPIO 21 (I2C SDA) and GPIO 25 (DAC1) have internal pull-ups that
# prevent them from cleanly driving LEDs. E_R→GPIO26, W_R→GPIO27 instead.
PINS = {
    "N_G": Pin(12, Pin.OUT),  "N_Y": Pin(13, Pin.OUT),  "N_R": Pin(14, Pin.OUT),
    "S_G": Pin(15, Pin.OUT),  "S_Y": Pin(16, Pin.OUT),  "S_R": Pin(17, Pin.OUT),
    "E_G": Pin(18, Pin.OUT),  "E_Y": Pin(19, Pin.OUT),  "E_R": Pin(26, Pin.OUT),
    "W_G": Pin(22, Pin.OUT),  "W_Y": Pin(23, Pin.OUT),  "W_R": Pin(27, Pin.OUT),
}

def all_off():
    for p in PINS.values():
        p.value(0)

def read_cpu_temp_c() -> float:
    """Read internal ESP32 temperature sensor. Returns degrees Celsius."""
    raw_f = esp32.raw_temperature()  # Returns raw value in Fahrenheit
    return round((raw_f - 32) / 1.8, 1)

def set_arm(arm_prefix, color):
    """Turn on exactly one color for one arm, off all others on that arm."""
    PINS[f"{arm_prefix}_G"].value(1 if color == "G" else 0)
    PINS[f"{arm_prefix}_Y"].value(1 if color == "Y" else 0)
    PINS[f"{arm_prefix}_R"].value(1 if color == "R" else 0)

# ── Target Phase-to-LED Map ───────────────────────────────────────────────────
# Final steady-state colors for each phase: (North, South, East, West)
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

# ── Current state ─────────────────────────────────────────────────────────────
_current_phase = "UNSET"          # Forces apply_phase to write GPIO on first call
_current_colors = ("X", "X", "X", "X")  # "X" never matches any real color

def _apply_colors(colors):
    """Immediately write a color tuple to all 4 arms."""
    for arm, color in zip(ARM_PREFIXES, colors):
        set_arm(arm, color)

def _yellow_intermediate(from_colors, to_colors):
    """
    Build a yellow-transition tuple:
    - Arms moving Green→Red get Yellow first
    - Arms moving Red→Green get Yellow first
    - Arms already matching the destination stay unchanged
    Returns the intermediate colors tuple, or None if no transition needed.
    """
    intermediate = list(from_colors)
    needs_transition = False

    for i in range(4):
        src, dst = from_colors[i], to_colors[i]
        if src == "G" and dst == "R":
            # Green → Yellow → Red
            intermediate[i] = "Y"
            needs_transition = True
        elif src == "R" and dst == "G":
            # Red → Yellow → Green
            intermediate[i] = "Y"
            needs_transition = True
        # Y→R, Y→G, same→same: no intermediate needed, apply directly

    return tuple(intermediate) if needs_transition else None

def apply_phase(phase: str) -> bool:
    """
    Apply a phase with yellow transitions.
    
    Sequence for a change that touches a green/red pair:
      1. All arms that need to change: show YELLOW for 1 second
      2. Apply final target colors
    
    Emergency phases bypass yellow (instant override for safety).
    """
    global _current_phase, _current_colors

    target_colors = PHASE_MAP.get(phase)
    if target_colors is None:
        print(f"[LED] ⚠️ Unknown phase '{phase}' — setting ALL_RED")
        target_colors = ("R", "R", "R", "R")
        phase = "ALL_RED"

    # Bypass transition for emergency or same phase
    is_emergency = phase.startswith("EMERGENCY")
    is_same = (target_colors == _current_colors)

    if not is_emergency and not is_same:
        intermediate = _yellow_intermediate(_current_colors, target_colors)
        if intermediate is not None:
            # Step 1: Flash intermediate yellow state
            _apply_colors(intermediate)
            print(f"[LED] Yellow transition: {intermediate}")
            time.sleep_ms(1000)   # Hold yellow for 1 second

    # Step 2: Apply final target
    _apply_colors(target_colors)
    _current_phase  = phase
    _current_colors = target_colors
    print(f"[LED] Phase applied: {phase} → N:{target_colors[0]} S:{target_colors[1]} E:{target_colors[2]} W:{target_colors[3]}")
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

    # Start with all-red as safe default.
    # NOTE: Do NOT call all_off() here — it would desync _current_colors from GPIO state.
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
                    resp = make_response(200, {
                        "status": "ok",
                        "phase_applied": phase,
                        "leds": {
                            "north": _current_colors[0],
                            "south": _current_colors[1],
                            "east":  _current_colors[2],
                            "west":  _current_colors[3],
                        }
                    })
                except Exception as e:
                    print(f"[HTTP] JSON parse error: {e}")
                    resp = make_response(400, {"status": "error", "detail": str(e)})

            # ── GET /ping ─────────────────────────────────────────────────────
            elif method == "GET" and path == "/ping":
                resp = make_response(200, {
                    "status": "ok",
                    "device": "esp32_controller",
                    "phase": _current_phase,
                    "cpu_temp_c": read_cpu_temp_c(),
                })

            # ── GET /test_leds ─────────────────────────────────────────────
            elif method == "GET" and path == "/test_leds":
                # Cycle every LED one by one to confirm GPIO wiring
                for name, pin in PINS.items():
                    pin.value(1)
                    time.sleep_ms(1000)
                    pin.value(0)
                resp = make_response(200, {"status": "ok", "message": "All LEDs cycled"})

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
