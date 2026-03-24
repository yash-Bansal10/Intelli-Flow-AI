# Intelli-Flow AI — Frontend Implementation Plan
**Dashboard:** `traffic-dashboard_main/` (Next.js 14, TailwindCSS v3)
**Simulation Backend:** Flask on `http://localhost:5000` — endpoint: `GET /live_data`
**Hardware Backend:** FastAPI on `http://localhost:8000` — endpoints documented below

---

## Overview of Gaps Found

| Area | Current State | Gap |
|------|--------------|-----|
| **API wiring** | Zero API calls — 100% hardcoded mock data | Nothing is live |
| **Junction map** | Hardcoded J1–J5 nodes (5 junctions) | Real SUMO sim has 4×4 = 16 junctions: A0–D3 |
| **Junction drawer** | Hardcoded NS_GREEN, static bar chart | Should show real phase, queues from API |
| **Emergency button** | No API call, no arm selector, wrong banner text | Should POST to `/api/trigger_emergency` with arm |
| **Camera page** | Placeholder image, YOLOv8 label (wrong) | Should render `/api/yolo_feed` JPEG with live lane PCU |
| **HealthMonitor** | Shows OLED + INMP441 mic (removed from hw) | Should poll `/api/health` for real component status |
| **Analytics page** | All charts are hardcoded static values | Congestion score & junction scores from live data |
| **Neighbor pressure** | Not present anywhere in frontend | Hardware backend has `/api/set_neighbor_pressure` |
| **Total congestion** | Not displayed anywhere | `total_congestion` field from both API responses |
| **Simulation time** | Not displayed anywhere | `simulation_time` from API |

---

## Shared Infrastructure (Build First)

### [NEW] `lib/api.ts`
Central API client with typed responses. All pages import from here — never hardcode URLs.

```ts
// Two backends — one for SUMO simulation, one for hardware demo
const SIM_API   = process.env.NEXT_PUBLIC_SIM_API_URL   ?? "http://localhost:5000"
const HW_API    = process.env.NEXT_PUBLIC_HW_API_URL    ?? "http://localhost:8000"

// Types matching the actual API response shapes
export type JunctionData = {
  phase: string          // "NS-Green" | "EW-Green" | "Emergency-N" etc.
  queues: number[]       // 12-element PCU list
  score: number          // reward score, can be negative
}

export type SimulationState = {
  junctions: Record<string, JunctionData>
  simulation_time: number
  total_congestion: number
  city_coordinated?: boolean
}

export type HardwareHealth = {
  camera:     { connected: boolean; alive: boolean; last_frame_age_s: number }
  yolo:       { ready: boolean; model: string }
  dqn:        { loaded: boolean; weights_path: string }
  esp32_ctrl: { reachable: boolean }
  junction_id: string
  uptime_ticks: number
}

// Fetchers
export const fetchSimState   = (): Promise<SimulationState> =>
  fetch(`${SIM_API}/live_data`).then(r => r.json())

export const fetchHwStatus   = (): Promise<SimulationState & { esp32_phase: string; tick_ms: number }> =>
  fetch(`${HW_API}/api/status`).then(r => r.json())

export const fetchHwHealth   = (): Promise<HardwareHealth> =>
  fetch(`${HW_API}/api/health`).then(r => r.json())

export const fetchYoloFeed   = (): Promise<{ image_b64: string }> =>
  fetch(`${HW_API}/api/yolo_feed`).then(r => r.json())

export const triggerEmergency = (arm: string) =>
  fetch(`${HW_API}/api/trigger_emergency`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ arm })
  })

export const resetEmergency = () =>
  fetch(`${HW_API}/api/reset_emergency`, { method: "POST" })

export const setNeighborPressure = (arm: string, value: number) =>
  fetch(`${HW_API}/api/set_neighbor_pressure`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ arm, value })
  })
```

### [NEW] `hooks/useSimData.ts`
Polls `GET /live_data` every 1 second. Used by the **Overview page only**.
```ts
// Returns: { data: SimulationState | null, isLoading, error }
// Uses useEffect + setInterval + AbortController for clean teardown
```

### [NEW] `hooks/useHardwareData.ts`
Polls `GET /api/status` every 1 second. Used by the **Camera page only**.

> **Page → Backend mapping (fixed, no toggle needed):**
> - Overview tab → Simulation backend (`SIM_API /live_data`)
> - Camera tab → Hardware backend (`HW_API /api/status` + `/api/yolo_feed`)

### [MODIFY] `.env.local` (create at root)
```
NEXT_PUBLIC_SIM_API_URL=http://localhost:5000
NEXT_PUBLIC_HW_API_URL=http://localhost:8000
```

---

## Page 1: Overview (`app/page.tsx` + `SimulationCanvas.tsx` + `JunctionDrawer.tsx`)

### Problem
The junction map has 5 hardcoded nodes (J1–J5) matching nothing in the real simulation.
The simulation runs 16 junctions in a 4×4 grid: **A0, A1, A2, A3, B0, B1, B2, B3, C0, C1, C2, C3, D0, D1, D2, D3**.

### [MODIFY] `components/SimulationCanvas.tsx`

**Change 1 — Junction positions**
Replace `JUNC_POSITIONS` with the real 16-node 4×4 grid layout mapped to SVG coordinates:
```
Row A: A0(100,100)  A1(267,100)  A2(433,100)  A3(600,100)
Row B: B0(100,233)  B1(267,233)  B2(433,233)  B3(600,233)
Row C: C0(100,367)  C1(267,367)  C2(433,367)  C3(600,367)
Row D: D0(100,500)  D1(267,500)  D2(433,500)  D3(600,500)
```
SVG viewBox changes to `0 0 700 600`.

**Change 2 — Edges**
Auto-generate grid edges: each node connects to its right neighbor and bottom neighbor. This gives 24 edges forming the 4×4 grid streets. Remove the hardcoded `EDGES` array.

**Change 3 — Live data binding**
Accept `simulationData: SimulationState | null` as a prop.
For each junction node, read `simulationData?.junctions[id]`:
- Node fill color = green if phase is "NS-Green", blue if "EW-Green", red if emergency
- Node inner dot = pulse red if `phase.startsWith("Emergency")`
- Node label (on hover) = `"Phase: NS-Green | Score: 46"`

**Change 4 — Traffic density dots**
Replace 40 random static dots with real dots per junction:
- For each junction, read `queues` (12-element list), sum to get total vehicles
- Draw 1 dot per 3 vehicles near that node, positioned randomly in ±30px radius
- Dot color = red if ambulance detected (emergency arm), else blue

**Change 5 — Green corridor overlay**
When emergency is active and an arm is set, compute a path through adjacent junctions and draw the animated red polyline through those nodes.

**Change 6 — Total congestion badge**
Add a badge overlay at top-right of the SVG: `Total Congestion: {total_congestion}` and `Sim Time: {simulation_time}s` updated live.

### [MODIFY] `app/page.tsx`

**Change 1 — Wire live data**
Add `useSimData()` hook at the top of `TrafficOverview`. Pass `data` to `SimulationCanvas` and `JunctionDrawer`.

**Change 2 — Emergency button → arm selector**
Replace the single "Simulate Emergency Protocol" button with:
1. A dropdown/segmented control to pick arm: `North | South | East | West`
2. An "Activate" button that calls `triggerEmergency(selectedArm)` on the hardware backend
3. A "Cancel" button that calls `resetEmergency()`
4. The red banner text should update to say the correct arm (not "J1 INMP441 Mic" which is wrong and references deleted hardware)

**Change 3 — Remove INMP441 and OLED references**
The emergency banner text currently says *"Source: Node J1 INMP441 Mic | YAMNet Audio Siren Conf: 98.4%"* — replace with *"Source: YOLOv11s Vision | Detected: ambulance in {arm} zone"*.

**Change 4 — Live stats strip**
Add a small stats strip between the header and the canvas:
- `Simulation Time: {simulation_time}s`
- `Total Congestion: {total_congestion} PCU`
- `Junctions: 16 Active`
- `DQN Coordination: {city_coordinated ? "Multi-Agent" : "Single"}`

### [MODIFY] `components/JunctionDrawer.tsx`

**Change 1 — Accept live data prop**
Add prop `junctionData: JunctionData | null`. Everything below uses this data.

**Change 2 — Live phase display**
Replace hardcoded `"NS_GREEN"` string with `junctionData?.phase`. Color the text based on phase:
- NS-Green → sky-400
- EW-Green → emerald-400
- Emergency → red-500, with pulsing animation

**Change 3 — Remove elapsed time**
The implementation plan notes there is no timer — the model changes lights based on state, not time. Remove the "Elapsed: 42s" field. Replace with `Score: {junctionData?.score}` with color coding (green if positive, red if negative).

**Change 4 — Live queue chart**
Replace hardcoded `queueData` array with data derived from `junctionData.queues`:
```ts
// queues[0+1+2]→North, [3+4+5]→South, [6+7+8]→East, [9+10+11]→West
const queueData = [
  { name: 'North', queue: queues[0]+queues[1]+queues[2] },
  { name: 'South', queue: queues[3]+queues[4]+queues[5] },
  ...
]
```
The chart re-renders every time new data arrives.

**Change 5 — DQN Q-values display**
The Q-values are available in the hardware status response. Show them as colored pills:
`Q = [NS-Green: 2.4, EW-Green: -0.8, All-Red: 0.1]` with the highest value highlighted.

**Change 6 — Health monitor section**
This section should only show for the hardware demo junction (identified by `JUNCTION_ID` config). For SUMO junctions, show neighbor pressure values instead (from the state vector indices 13-16).

---

## Page 2: Live Camera (`app/camera/page.tsx`)

### Problems
- The camera placeholder has a comment referencing Flask `/video_feed` (wrong — hardware backend is FastAPI)
- "YOLOv8" in subtitle should be **YOLOv11s**
- Badge shows static "24 FPS" — should show real FPS from health endpoint
- Lane PCU panels show hardcoded data
- No real MJPEG/JPEG stream connected

### [MODIFY] `app/camera/page.tsx`

**Change 1 — Connect real YOLO feed**
Poll `GET /api/yolo_feed` every 500ms (not a real MJPEG stream — it's JPEG snapshots from the hardware backend). Display the base64 JPEG:
```tsx
<img src={`data:image/jpeg;base64,${imageb64}`} className="absolute inset-0 w-full h-full object-contain" />
```
Show the placeholder only while `image_b64` is null.

**Change 2 — Fix subtitle**
Change "YOLOv8 Analytics" → "YOLOv11s Analytics"

**Change 3 — Real FPS + tick time badge**
Poll `/api/health`. Replace static "24 FPS" badge with `{(1000 / tick_ms).toFixed(1)} FPS (tick: {tick_ms}ms)`.

**Change 4 — Live lane PCU panels**
Connect to `useHardwareData()`. Derive lane data from `junctions[JUNCTION_ID].queues`:
- North PCU = queues[0]+[1]+[2], pressure = (northPCU / 40) * 100
- South similarly, East, West
- Vehicle count = Math.round(PCU) since PCU is 1.0 per toy car

**Change 5 — Real OSD overlays**
Phase overlay: real `current_phase` from `/api/status`
Q-values overlay: real `q_values` array
Remove avg wait time (not measured in hardware demo)

**Change 6 — Remove mock bounding boxes**
The hardcoded "Car 0.89" and "Bus 0.95" bounding box divs should be removed. The YOLO feed image from `/api/yolo_feed` already has bounding boxes drawn on it by `zone_detector.draw_zone_overlay()`.

**Change 7 — Emergency arm detection badge**
If `emergency_arm` is not null in hardware status, show a red pulsing "🚨 EMERGENCY: {arm.toUpperCase()} — Ambulance Detected" badge over the camera feed.

---

## Page 3: Analytics (`app/analytics/page.tsx`)

### Problems
- All 4 metric cards use hardcoded static numbers
- "DQN Training Convergence" chart uses `Math.random()` — regenerates on every render
- No live congestion data displayed

### [MODIFY] `app/analytics/page.tsx`

**Change 1 — Wire live congestion trend chart**
Add a new `LineChart` showing `total_congestion` over time. Maintain a rolling 60-tick history in a `useRef` array:
```ts
const congestionHistory = useRef<{tick: number, value: number}[]>([])
// Append new datapoint each time simulation data updates
```

**Change 2 — Per-junction score heatmap bar**
Add a horizontal `BarChart` with all 16 junctions (A0–D3) on the X axis and their `score` on the Y axis. Color bars green if score > 0, red if score < 0. Updates live from `/live_data`.

**Change 3 — Fix DQN reward chart**
Replace `Math.random()` with a stable seed-based generation that doesn't re-randomize on every render (`useMemo` with an empty dep array). Users should not see the chart jump around.

**Change 4 — Metric cards — leave as static (intentional)**
These cards (CO₂ saved, fuel saved etc.) are projection estimates and should remain static. They are intentionally not live-data-driven — they are impact visualizations.

---

## Page 4: `HealthMonitor.tsx` (inside JunctionDrawer)

### Problems
- Shows **INMP441 Mic** and **OLED display** — both removed from hardware
- All values are hardcoded static numbers

### [MODIFY] `components/HealthMonitor.tsx`

**Change 1 — Accept health data as prop**
```ts
interface HealthMonitorProps { health: HardwareHealth | null }
```

**Change 2 — Update component list**
Replace the 6 hardcoded cards with 5 real ones matching current hardware:

| Card | Source field | Data shown |
|------|-------------|------------|
| DQN Agent | `health.dqn` | Loaded: Yes/No, tick_ms |
| ESP32-CAM | `health.camera` | Connected, last_frame_age, alive |
| YOLOv11s | `health.yolo` | Ready, model name |
| ESP32 Controller | `health.esp32_ctrl` | Reachable: Yes/No |
| Backend | uptime_ticks | Tick count, inference speed |

**Change 3 — Real status indicators**
Each card header gets a green dot if healthy, amber if degraded, red if offline.
Use: `connected`, `alive`, `ready`, `loaded`, `reachable` from the health response.

**Change 4 — Remove OLED and INMP441 completely**
Delete the `"OLED display"` and `"INMP441 Mic"` card entries. Remove `Mic` and `Tv` imports.

---

## New Feature: Neighbor Pressure Controls

### Where: Inside `JunctionDrawer.tsx` (hardware demo junction only)

The hardware backend has `POST /api/set_neighbor_pressure` for injecting simulated neighbor junction traffic. No UI for this exists currently.

**Add a collapsible "Neighbor Pressure" section** at the bottom of the junction drawer, only visible for the hardware JUNCTION_ID:

```
North Pressure  [────────●────] 3.5 PCU  [Set]
South Pressure  [●───────────] 0.0 PCU  [Set]
East Pressure   [──────●─────] 2.2 PCU  [Set]
West Pressure   [───────────●] 4.0 PCU  [Set]
```

- Four range sliders (0–20 PCU), one per arm
- On slider release `onMouseUp`, call `setNeighborPressure(arm, value)`
- Label: *"Simulates adjacent junction pressure for this demo"*

---

## Sidebar
No changes needed. The existing 5 nav items are correct. Backend selection is fixed per page — no toggle required.

---

## Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | Create `lib/api.ts` and `.env.local` | New files |
| 2 | Create `hooks/useSimData.ts` and `hooks/useHardwareData.ts` | New files |
| 3 | Fix `SimulationCanvas.tsx` — real 16-node grid | Modify |
| 4 | Wire `page.tsx` — `useSimData`, pass data down | Modify |
| 5 | Fix emergency button (arm selector + API call) | Modify `page.tsx` |
| 6 | Fix `JunctionDrawer.tsx` — live data | Modify |
| 7 | Fix `HealthMonitor.tsx` — remove OLED/mic, real data | Modify |
| 8 | Fix `camera/page.tsx` — `useHardwareData`, YOLO feed, real lane PCU | Modify |
| 9 | Fix analytics — live congestion chart, stable DQN chart | Modify |
| 10 | Add neighbor pressure sliders to JunctionDrawer | Modify |

---

## API Endpoints Reference

### Simulation Backend (Flask — always running during SUMO)
| Endpoint | Method | Used In |
|----------|--------|---------|
| `/live_data` | GET | Overview page, Analytics |

### Hardware Backend (FastAPI — running with ESP32 demo)
| Endpoint | Method | Used In |
|----------|--------|---------|
| `/api/status` | GET | Overview, Camera, JunctionDrawer |
| `/api/health` | GET | HealthMonitor, Camera page badges |
| `/api/yolo_feed` | GET | Camera page — JPEG frame |
| `/api/trigger_emergency` | POST | Emergency button (Overview page) |
| `/api/reset_emergency` | POST | Emergency cancel button |
| `/api/set_neighbor_pressure` | POST | Neighbor sliders (JunctionDrawer) |
