# Intelli-Flow AI — Hardware Implementation Plan
**Scope:** Physical demo system (ESP32-CAM + ESP32 Controller + laptop backend)
**Date:** March 19, 2026 | **Hackathon:** March 28, 2026

---

## ⚠️ Critical Hardware Note: Two Devices Required

> The user asked to send results to "ESP32-CAM" to control LEDs. However, the **AI-Thinker ESP32-CAM** module uses almost all its GPIO pins internally for the OV2640 camera and SD card, leaving only **2-3 usable GPIO pins** — not enough for 12 LEDs.
>
> **Solution (already planned):** Keep two devices as designed:
> - **Device A — ESP32-CAM**: Streams MJPEG video over WiFi only. No LEDs.
> - **Device B — ESP32 Controller**: Receives phase JSON from backend over WiFi, drives 12 LEDs via GPIO.
>
> The backend acts as the bridge: reads camera frames from Device A, processes them, sends phase command to Device B.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PHYSICAL JUNCTION MODEL                     │
│                                                                     │
│  [OV2640 lens overhead, 30cm FPC] ──── [ESP32-CAM board at base]   │
│                                               │ MJPEG stream/WiFi   │
│                                               ▼                     │
│                               ┌──────────────────────────────────┐  │
│                               │      LAPTOP BACKEND (FastAPI)    │  │
│                               │                                  │  │
│                               │  1. Read MJPEG frame             │  │
│                               │  2. Divide into 4 lane zones     │  │
│                               │  3. Run YOLOv11s per zone        │  │
│                               │  4. Build 28-element state vector │  │
│                               │  5. Run DQN inference            │  │
│                               │  6. Build phase JSON response    │  │
│                               └──────────────┬───────────────────┘  │
│                                              │ HTTP POST /set_phase  │
│                                              ▼                       │
│                               ┌──────────────────────────────────┐  │
│                               │    ESP32 Controller (Device B)   │  │
│                               │    MicroPython REST server       │  │
│                               │    GPIO → 12 LEDs (R/Y/G × 4)   │  │
│                               └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Communication Protocol:** All over mobile hotspot WiFi. No USB cables during demo.
**Backend cycle time:** Target < 1 second per tick (frame read → LED update).

---

## Part 1: Device A — ESP32-CAM Firmware

### Role
Stream live MJPEG video of the physical junction model to the laptop backend over WiFi. Nothing else.

### Firmware Approach
The AI-Thinker ESP32-CAM ships with a built-in CameraWebServer example in the Arduino IDE. Flash this example (or the equivalent MicroPython camera streaming script). Once flashed and connected to the hotspot, it auto-starts an HTTP server and serves:
- `http://[ESP32-CAM-IP]/stream` — continuous MJPEG stream
- `http://[ESP32-CAM-IP]/capture` — single JPEG frame on demand

### Camera Configuration
| Parameter | Value | Reason |
|-----------|-------|--------|
| Resolution | SVGA (800×600) or VGA (640×480) | Fast enough for YOLOv11s on CPU |
| Frame rate | 10–15 FPS | Sufficient for traffic demo |
| Quality | JPEG quality 12 (mid) | Balances file size and clarity |
| Positioning | OV2640 lens pointing straight down via 30cm FPC extension | Top-down orthographic view of junction |

### WiFi Setup (in firmware)
```
SSID: [your mobile hotspot name]
Password: [hotspot password]
Static IP (optional): 192.168.43.120  ← set in router/hotspot for stability
```

### Files
```
esp32_cam_firmware/
└── CameraWebServer.ino   (Arduino sketch, or camera_stream.py for MicroPython)
```

---

## Part 2: Device B — ESP32 Controller Firmware

### Role
Run a tiny HTTP REST server. Accept phase JSON from the laptop. Drive 12 GPIO pins to control 12 LEDs.

### Firmware Approach
MicroPython on the standard ESP32 board. Two files:

**`boot.py`** — connects to WiFi hotspot on startup, gets IP address.

**`main.py`** — starts HTTP server, listens on port 80 for `POST /set_phase`. Parses JSON body, maps `current_phase` string to GPIO HIGH/LOW pattern, fires each of the 12 GPIO pins accordingly.

### GPIO Pin Assignment
```
ARM         GREEN      YELLOW    RED
North   →  GPIO 12    GPIO 13   GPIO 14
South   →  GPIO 15    GPIO 16   GPIO 17
East    →  GPIO 18    GPIO 19   GPIO 21
West    →  GPIO 22    GPIO 23   GPIO 25
```

Each GPIO → 220Ω resistor → LED anode → LED cathode → GND.

### Phase-to-LED Mapping
The backend sends one of these `current_phase` strings:

| `current_phase` value | North | South | East | West |
|----------------------|-------|-------|------|------|
| `"NS_GREEN"` | 🟢 | 🟢 | 🔴 | 🔴 |
| `"NS_YELLOW"` | 🟡 | 🟡 | 🔴 | 🔴 |
| `"EW_GREEN"` | 🔴 | 🔴 | 🟢 | 🟢 |
| `"EW_YELLOW"` | 🔴 | 🔴 | 🟡 | 🟡 |
| `"ALL_RED"` | 🔴 | 🔴 | 🔴 | 🔴 |
| `"EMERGENCY_N"` | 🟢 | 🔴 | 🔴 | 🔴 |
| `"EMERGENCY_S"` | 🔴 | 🟢 | 🔴 | 🔴 |
| `"EMERGENCY_E"` | 🔴 | 🔴 | 🟢 | 🔴 |
| `"EMERGENCY_W"` | 🔴 | 🔴 | 🔴 | 🟢 |

The ESP32 stores this as a Python dictionary in `main.py`. On receiving the phase string, it iterates through the dictionary and fires GPIOs accordingly.

### REST Endpoint
```
POST http://[ESP32-IP]/set_phase
Content-Type: application/json

{
    "simulation_time": 42,
    "current_phase": "NS_GREEN",
    "queues": {"north": 3, "south": 1, "east": 4, "west": 0},
    "congestion_score": 0.61
}
```

Response: `{"status": "ok", "phase_applied": "NS_GREEN"}`

### Files
```
esp32_controller_firmware/
├── boot.py    ← WiFi connect
└── main.py    ← REST server + GPIO driver
```

---

## Part 3: Laptop Backend (FastAPI)

### Architecture
A Python FastAPI application with a background processing loop. Serves as the brain of the entire system.

### Responsibilities
1. Continuously read frames from the ESP32-CAM MJPEG stream
2. Divide each frame into 4 lane zones
3. Run YOLOv11s on each zone → classify vehicles and detect ambulance/fire truck
4. Apply PCU weights → compute pressure per lane
5. Build the 28-element state vector
6. Load and run the DQN model
7. **If ambulance/fire truck detected → skip DQN, immediately set EMERGENCY phase for that arm**
8. Otherwise decode DQN output → determine phase string
9. Send phase JSON to ESP32 Controller via HTTP POST
9. Expose its own REST API for the dashboard (current state, queues, metrics)

### Folder Structure
```
hardware_backend/
├── main.py                  ← FastAPI app entry point
├── camera_reader.py         ← MJPEG stream reader (OpenCV)
├── zone_detector.py         ← Frame → 4 lane zone crops
├── yolo_counter.py          ← YOLOv11s inference + PCU + ambulance detection
├── state_builder.py         ← Assembles all 28 state vector elements
├── rl_model.py              ← Loads DQN weights, runs inference
├── phase_decoder.py         ← Maps DQN output → phase string
├── esp32_client.py          ← HTTP client → POSTs to ESP32 Controller
├── config.py                ← IP addresses, thresholds, constants
└── requirements.txt
```

---

## Part 4: Top-Down Zone Detection

### Physical Setup
The OV2640 camera looks straight down at the chart paper junction. The junction is drawn as a **plus (+)** shape. The frame from the camera looks like this:

```
+───────────────────────────────+
│         NORTH ZONE            │  ← rows 0 to (H/3)
│    (vehicles approaching N)   │
+───────────────────────────────+
│ WEST  │   CENTER   │  EAST    │  ← rows (H/3) to (2H/3)
│ ZONE  │  (ignored) │  ZONE    │
+───────────────────────────────+
│         SOUTH ZONE            │  ← rows (2H/3) to H
│    (vehicles approaching S)   │
+───────────────────────────────+
```

### Zone Crop Coordinates (for a 640×480 frame)
```
frame_w = 640,  frame_h = 480
cx = 320,  cy = 240           # center point of frame
strip_w = 180                 # width of road arm in pixels

ZONES = {
    "north": crop(x: cx-strip_w/2 → cx+strip_w/2,  y: 0 → cy-strip_w/2),
    "south": crop(x: cx-strip_w/2 → cx+strip_w/2,  y: cy+strip_w/2 → h),
    "east":  crop(x: cx+strip_w/2 → w,              y: cy-strip_w/2 → cy+strip_w/2),
    "west":  crop(x: 0 → cx-strip_w/2,              y: cy-strip_w/2 → cy+strip_w/2),
}
```

The `strip_w` value must be calibrated to match the actual width of the road arms drawn on the chart paper. It is set once in `config.py` and never changes.

### Calibration Step (one-time, before demo)
Place a ruler or known-width object on the road arm in the camera view. Measure how many pixels wide the road arm appears in the frame. Set that as `strip_w` in `config.py`.

---

## Part 5: YOLOv11s Vehicle Counter + Ambulance Detection

### Model
**YOLOv11s** fine-tuned on photos of your specific toy vehicles. Three output classes:
- `car` — regular toy car (PCU = 1.0)
- `ambulance` — toy ambulance (triggers emergency override)
- `fire_truck` — toy fire truck (triggers emergency override)

> **Fine-tuning required:** The base YOLOv11s model is trained on real vehicles and will not reliably detect small toy cars from a top-down angle. You must fine-tune on a small dataset of top-down photos of your own toy vehicles.
>
> **How to collect training data:**
> 1. Mount ESP32-CAM in position above the junction.
> 2. Place toy cars one at a time (or in groups) on each road arm.
> 3. Capture ~50–80 photos per class from the fixed overhead angle.
> 4. Annotate using [Roboflow](https://roboflow.com) (free tier) — draw bounding boxes, assign class labels.
> 5. Export as YOLOv11 format. Fine-tune for 50 epochs. Save as `yolo11s_toycar.pt`.
>
> The user already has a `vehicle-dataset-for-yolo` dataset which may provide supplementary real-vehicle data for normalization.

### Per-Zone Detection Flow
For each of the 4 zone crops:
1. Run `model(zone_crop)` → list of detections, each with `class_name` and `bounding_box`
2. **Check for ambulance/fire_truck FIRST (emergency override check)**
3. Map remaining `car` detections to PCU weight (1.0 per car)
4. Sum PCU → `zone_pcu`

```
PCU_WEIGHTS = {
    "car":        1.0,
    "ambulance":  0.0,   # not counted as pressure — triggers override instead
    "fire_truck": 0.0,   # same
}
```

5. Output per zone: `{"north": {"pcu": 3.0, "emergency": False, "count": 3}}`

### 🚨 Ambulance Detection → Automatic Emergency Override

This is handled **before** the DQN model is called. The logic is:

```
For each zone in [north, south, east, west]:
    If "ambulance" OR "fire_truck" detected in that zone:
        emergency_arm = zone name  (e.g., "north")
        SKIP DQN entirely
        Set current_phase = "EMERGENCY_{ARM}"  (e.g., "EMERGENCY_N")
        Set EVP flag for that arm = 1.0
        Send EMERGENCY_N to ESP32 → North LED goes GREEN, all others RED
        Break out of normal tick loop
```

This means:
- You physically place the toy ambulance on the North road arm
- YOLOv11s detects it as `ambulance` in the North zone
- Within 1 second: North LED turns GREEN, South/East/West go RED
- The ambulance can drive straight through unimpeded
- When you remove the ambulance, next tick returns to normal DQN control

The override is **purely camera-driven** — no button press needed. The physical act of placing the toy ambulance on the road triggers it automatically. This is the most impressive demo moment.

---

## Part 6: 28-Element State Vector Construction

The DQN model expects a fixed numpy array of 28 float32 values every tick.

### Index-by-Index Breakdown

| Index | Name | Source in Demo | Value |
|-------|------|----------------|-------|
| 0 | PCU — North lane 1 | YOLO zone count ÷ 3 | float |
| 1 | PCU — North lane 2 | YOLO zone count ÷ 3 | float |
| 2 | PCU — North lane 3 | YOLO zone count ÷ 3 | float |
| 3 | PCU — South lane 1 | YOLO zone count ÷ 3 | float |
| 4 | PCU — South lane 2 | YOLO zone count ÷ 3 | float |
| 5 | PCU — South lane 3 | YOLO zone count ÷ 3 | float |
| 6 | PCU — East lane 1 | YOLO zone count ÷ 3 | float |
| 7 | PCU — East lane 2 | YOLO zone count ÷ 3 | float |
| 8 | PCU — East lane 3 | YOLO zone count ÷ 3 | float |
| 9 | PCU — West lane 1 | YOLO zone count ÷ 3 | float |
| 10 | PCU — West lane 2 | YOLO zone count ÷ 3 | float |
| 11 | PCU — West lane 3 | YOLO zone count ÷ 3 | float |
| 12 | Current Phase | Backend state variable (1=NS, 0=EW) | 0 or 1 |
| 13 | Neighbor pressure — North | **Simulated / 0.0 in demo** | float |
| 14 | Neighbor pressure — South | **Simulated / 0.0 in demo** | float |
| 15 | Neighbor pressure — East | **Simulated / 0.0 in demo** | float |
| 16 | Neighbor pressure — West | **Simulated / 0.0 in demo** | float |
| 17 | EVP — North (emergency from N) | Dashboard trigger button → 1.0 | 0 or 1 |
| 18 | EVP — South | Dashboard trigger button → 1.0 | 0 or 1 |
| 19 | EVP — East | Dashboard trigger button → 1.0 | 0 or 1 |
| 20 | EVP — West | Dashboard trigger button → 1.0 | 0 or 1 |
| 21 | Config const 1 | Hardcoded: `0.5` | 0.5 |
| 22 | Config const 2 | Hardcoded: `1.0` | 1.0 |
| 23 | Config const 3 | Hardcoded: `0.0` | 0.0 |
| 24 | Config const 4 | Hardcoded: `0.5` | 0.5 |
| 25 | Config const 5 | Hardcoded: `1.0` | 1.0 |
| 26 | Config const 6 | Hardcoded: `0.0` | 0.0 |
| 27 | Config const 7 | Hardcoded: `1.0` | 1.0 |

### Lane Splitting (Indices 0–11)
Since the camera cannot distinguish individual lanes within an arm, the total zone PCU is **divided equally by 3** and assigned to all 3 lane indices for that arm. This preserves the correct total pressure at the model input.

```
north_pcu = yolo_output["north"]   # e.g., 6.0

state[0] = north_pcu / 3           # → 2.0
state[1] = north_pcu / 3           # → 2.0
state[2] = north_pcu / 3           # → 2.0
```

### Neighbor Pressure (Indices 13–16)
In the hardware demo there is only one physical junction. These values are set to `0.0` by default. The dashboard provides a set of **manual sliders** to inject simulated neighbor pressure during demo — useful to showcase the feature.

### Emergency Preemption (Indices 17–20)
In the hardware demo, these are **automatically set to `1.0`** by the ambulance/fire_truck detection in `yolo_counter.py`. No button press needed. When YOLOv11s sees an ambulance in the North zone, `state[17] = 1.0` — and the DQN is bypassed entirely (the emergency override in `main.py` fires before the model call). The dashboard Emergency button can still manually set these for a software-only demo if the physical ambulance is not present.

---

## Part 7: DQN Model Inference

### Loading
The model is saved as TensorFlow weights (`.h5` or `SavedModel` format). At startup, the backend reconstructs the exact same neural network architecture used during training, then loads the weights:

```python
# In rl_model.py
model = build_dqn_architecture()   # same layers as training code
model.load_weights("path/to/weights.h5")
```

> **Important:** The `build_dqn_architecture()` function must exactly match what was used during training (same layer sizes, activations, input shape). The input shape must be `(1, 28)` — a batch of one state vector.

### Inference Flow
```
state_vector (numpy array, shape: (28,))
    │
    ▼
model.predict(state_vector.reshape(1, 28))
    │
    ▼
q_values (numpy array, shape: (1, num_actions))
    │
    ▼
action_index = argmax(q_values[0])
    │
    ▼
phase_string = ACTION_MAP[action_index]
```

### Action Map
The DQN outputs an integer action. This must match the mapping used during training:

```python
ACTION_MAP = {
    0: "NS_GREEN",
    1: "EW_GREEN",
    2: "ALL_RED",
    # add more if model was trained with more actions
}
```

> **Verify with the team's training code** what the exact action index → phase mapping is. This is critical.

---

## Part 8: Backend API Response + ESP32 POST

### Response JSON (exactly as specified)
```json
{
    "simulation_time": 143,
    "current_phase": "NS_GREEN",
    "queues": {
        "north": 3,
        "south": 1,
        "east": 4,
        "west": 0
    },
    "congestion_score": 0.61
}
```

### Queue Values
`queues` is the raw vehicle count (not PCU) per arm, rounded to integer:
```python
queues["north"] = round(yolo_counts["north"])   # number of detected vehicles
```

### Congestion Score
A single float 0.0–1.0 representing overall junction stress:
```python
total_pcu = sum([north_pcu, south_pcu, east_pcu, west_pcu])
max_pcu_per_junction = 40.0   # configurable cap
congestion_score = min(total_pcu / max_pcu_per_junction, 1.0)
```

### ESP32 POST flow
After building the JSON, the backend sends it to Device B:
```
POST http://192.168.43.150/set_phase    ← ESP32 Controller IP
Body: the full JSON above
Timeout: 500ms
```

---

## Part 9: Dashboard API Endpoints

The dashboard also polls the laptop backend:

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/api/status` | GET | Full current state (phase, queues, EVP flags, congestion) |
| `/api/yolo_feed` | GET | Latest annotated frame (JPEG) with zone boxes and bounding boxes |
| `/api/trigger_emergency` | POST | Body: `{"arm": "north"}` → sets EVP[17]=1.0 for next tick |
| `/api/set_neighbor_pressure` | POST | Body: `{"arm": "north", "value": 3.5}` → sets indices 13–16 |
| `/api/health` | GET | Component health (YOLO FPS, model load status, ESP32 ping) |

---

## Part 10: Config File

All hardcoded values live in `config.py` so no source code edits are needed at the demo:

```python
# config.py
ESP32_CAM_URL       = "http://192.168.43.120/stream"
ESP32_CTRL_URL      = "http://192.168.43.150"
DQN_WEIGHTS_PATH    = "../finetuning/models/dqn_weights.h5"
YOLO_MODEL_PATH     = "../finetuning/models/yolo11s_toycar.pt"   # fine-tuned YOLOv11s
FRAME_W             = 640
FRAME_H             = 480
STRIP_W             = 180         # road arm width in pixels (calibrate!)
TICK_INTERVAL_S     = 1.0         # seconds between model decisions
MAX_PCU             = 40.0        # for congestion score normalization
ACTION_MAP          = {0: "NS_GREEN", 1: "EW_GREEN", 2: "ALL_RED"}
PCU_WEIGHTS         = {"car": 1.0, "ambulance": 0.0, "fire_truck": 0.0}
EMERGENCY_CLASSES   = {"ambulance", "fire_truck"}   # triggers override
STATE_CONSTANTS     = [0.5, 1.0, 0.0, 0.5, 1.0, 0.0, 1.0]   # indices 21–27
```

---

## Part 11: Full Project File Structure

```
hardware_backend/
├── config.py                  ← All IPs, paths, constants
├── main.py                    ← FastAPI app, background tick loop
├── camera_reader.py           ← OpenCV MJPEG reader from ESP32-CAM
├── zone_detector.py           ← Crop frame into 4 lane zones
├── yolo_counter.py            ← YOLOv11s inference, PCU calc, ambulance detection
├── state_builder.py           ← Assemble 28-element state vector
├── rl_model.py                ← Load .h5 weights, run DQN inference
├── phase_decoder.py           ← action_index → phase string
├── esp32_client.py            ← HTTP POST to ESP32 Controller
├── requirements.txt
└── models/     ← (removed — models now live in finetuning/models/)

finetuning/
├── models/
│   ├── yolo11s_toycar.pt      ← YOLOv11s fine-tuned on toy cars
│   └── dqn_weights.h5         ← DQN weights (TensorFlow .h5 format)

esp32_cam_firmware/
└── CameraWebServer.ino        ← Arduino sketch for ESP32-CAM

esp32_controller_firmware/
├── boot.py                    ← WiFi connect on boot
└── main.py                    ← REST server + GPIO driver
```

---

## Part 12: Build Order (Day by Day)

| Day | Task |
|-----|------|
| **Day 1 (Mar 19)** | Flash ESP32-CAM with CameraWebServer sketch. Verify MJPEG stream accessible at IP. Flash MicroPython on ESP32 Controller. |
| **Day 2 (Mar 20)** | Wire 12 LEDs to ESP32 Controller GPIO. Write and test `boot.py` + `main.py`. Test `POST /set_phase` manually from Postman. All 12 LEDs respond to correct phases. |
| **Day 3 (Mar 21)** | Write `camera_reader.py`. Verify OpenCV reads live frames from ESP32-CAM. Write `zone_detector.py`. Visualize zone crops on screen with colored overlays. |
| **Day 4 (Mar 22)** | Integrate YOLOv11s (`yolo_counter.py`). Test on static photo of junction with toy cars. Test ambulance detection override. Tune `STRIP_W` calibration. |
| **Day 5 (Mar 23)** | Write `state_builder.py`. Build complete 28-element vector from live camera. Print vector every tick to verify values. |
| **Day 6 (Mar 24)** | Load DQN weights in `rl_model.py`. Run inference on dummy state. Verify action output. Map actions to phase strings. |
| **Day 7 (Mar 25)** | Wire everything in `main.py`. Full end-to-end tick: camera → YOLO → state → DQN → ESP32 → LEDs. |
| **Day 8 (Mar 26)** | Expose dashboard API endpoints. Test with dashboard polling. Emergency trigger button working. |
| **Day 9 (Mar 27)** | Full demo rehearsal. Build physical junction model. Calibrate camera. Fix all bugs. |
| **Day 10 (Mar 28)** | 🏆 **Demo Day** |

---

## Part 13: Known Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| YOLOv11s doesn't detect toy cars well | High — no vehicle counts | Fine-tuning on overhead toy car photos is **required**, not optional. Do this on Days 1–2 in parallel with firmware setup. Use Roboflow for annotation. |
| ESP32-CAM WiFi drops during demo | Medium | Set static IP. Place laptop and both ESP32s on same mobile hotspot. Keep hotspot close. |
| DQN model architecture mismatch | High — inference crashes | Confirm layer sizes with training team before Day 6. |
| Too many GPIO conflicts on ESP32-CAM | Already resolved | Two-device architecture handles this. |
| `STRIP_W` calibration off | Medium — wrong lane counts | Calibrate on Day 4, lock value in `config.py`. Draw thick visible lane lines on chart paper. |
| DQN always returns same action | Medium | May need to check input normalization matches training pipeline. |
